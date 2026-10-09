import { test, expect } from "@playwright/test";
import { zipEntries, type GeneratedPortal } from "../../../utils/artifacts.ts";
import { generateScenario } from "../../../utils/scenario.ts";

/**
 * Stage 1 of the pipeline: what `src/apimatic.json` DECLARED against what
 * `apimatic portal generate` actually PRODUCED.
 *
 * Filesystem checks only — no browser, no server. Each scenario copies the
 * build to a temp folder, changes what it's testing, generates a portal from
 * that copy and checks the output. The committed build is never edited.
 *
 * One `describe` = one scenario = one generation (~35s). Tests inside a
 * scenario share its output, so put related checks together rather than
 * giving each check its own scenario.
 *
 * Assertions compare against the scenario's own `portal.config()` — what was
 * declared after the change — never against hardcoded values.
 */

test.describe("Petstore — generated artifacts @artifacts", () => {
  test.describe("the build as committed", () => {
    let portal: GeneratedPortal;

    test.beforeAll(async () => {
      portal = await generateScenario("as committed");
    });
    test.afterAll(() => portal?.cleanup());

    test("the bundle has the entry points a static host needs", () => {
      // The CLI's own closing advice is to host these and wire 404.html as the
      // error document, so their absence breaks deployment rather than looks.
      expect(portal.exists("index.html"), "index.html").toBe(true);
      expect(portal.exists("404.html"), "404.html — the error document").toBe(true);
    });

    test("one SDK archive per declared language, and no extras", () => {
      expectArchivesMatchDeclared(portal);
    });

    test("each declared language gets a portal page", () => {
      expectPagePerDeclaredLanguage(portal);
    });

    test("the plugin block produces a context-plugin page", () => {
      test.skip(!portal.config().plugin, "no plugin declared in apimatic.json");
      expect(portal.exists("context-plugin", "index.html")).toBe(true);
    });

    test("the plugin archive doesn't bundle an SDK directory", () => {
      test.skip(!portal.config().plugin, "no plugin declared in apimatic.json");

      // The plugin bundles an SDK only for a language with no publishing block
      // (see "a language declared as an empty object"). Every language in the
      // committed build is published, so an sdk/ folder at any depth means SDK
      // sources leaked into the plugin.
      const archive = portal.path("__downloads", "plugin.zip");
      expect(portal.exists("__downloads", "plugin.zip"), "__downloads/plugin.zip").toBe(true);

      const sdkEntries = zipEntries(archive).filter((entry) =>
        entry.split("/").some((segment) => /^sdks?$/i.test(segment)),
      );
      expect(sdkEntries, "plugin.zip entries inside an sdk/ directory").toEqual([]);
    });

    // llms.txt and llms-full.txt are what an AI agent reads instead of the
    // portal. They're compared against committed baselines in
    // portal-snapshots/artifacts/petstore/ rather than against apimatic.json,
    // because their content comes from the pages and the spec, not the config.
    // Line endings and blank-line runs are normalized first: they vary with
    // the CLI build without the content changing. Any diff that's left is the
    // generator's content changing. Accept an intended change with
    // `pnpm test:artifacts:update`, and review the diff before committing.
    // Don't copy a generated llms-full.txt over the baseline: the baseline
    // holds the normalized text, so a raw copy fails on its blank lines.
    test("llms.txt matches the baseline", () => {
      expect(portal.readNormalized("llms.txt")).toMatchSnapshot("llms.txt");
    });

    test("llms-full.txt matches the baseline", () => {
      expect(portal.readNormalized("llms-full.txt")).toMatchSnapshot("llms-full.txt");
    });
  });

  test.describe("a language removed from apimatic.json", () => {
    const removed = "python";
    let portal: GeneratedPortal;

    test.beforeAll(async () => {
      portal = await generateScenario(`without ${removed}`, {
        config: (config) => {
          delete config.languages?.[removed];
        },
      });
    });
    test.afterAll(() => portal?.cleanup());

    test("only the remaining languages get SDK archives", () => {
      expectArchivesMatchDeclared(portal);
    });

    test("only the remaining languages get portal pages", () => {
      expectPagePerDeclaredLanguage(portal);
      // The generic check above can't see a page left behind for a language
      // that's no longer declared, so ask about the removed one directly.
      expect(
        portal.exists("sdks", removed, "index.html"),
        `sdks/${removed}/index.html should be gone once ${removed} is undeclared`,
      ).toBe(false);
    });
  });

  test.describe("a language declared as an empty object", () => {
    // With no publishing block there's no package for an agent to install, so
    // the plugin has to carry the SDK itself, under sdk/<language>/.
    const emptied = "python";
    let portal: GeneratedPortal;
    let entries: string[];

    test.beforeAll(async () => {
      portal = await generateScenario(`${emptied} as empty object`, {
        config: (config) => {
          config.languages![emptied] = {};
        },
      });
      entries = zipEntries(portal.path("__downloads", "plugin.zip"));
    });
    test.afterAll(() => portal?.cleanup());

    test("the plugin bundles an SDK only for the unpublished languages", () => {
      const unpublished = Object.entries(portal.config().languages ?? {})
        .filter(([, value]) => Object.keys(value as object).length === 0)
        .map(([name]) => name)
        .sort();
      const bundled = [
        ...new Set(entries.filter((e) => e.startsWith("sdk/")).map((e) => e.split("/")[1])),
      ]
        .filter(Boolean)
        .sort();

      // Both directions: a missing sdk/ folder leaves the agent nothing to
      // install, an extra one ships source for a language that has a package.
      expect(bundled, "sdk/ folders in plugin.zip").toEqual(unpublished);
    });

    test("the bundled SDK carries its package manifest", () => {
      // A folder holding only docs isn't an installable SDK.
      expect(entries, `plugin.zip should contain sdk/${emptied}/pyproject.toml`).toContain(
        `sdk/${emptied}/pyproject.toml`,
      );
    });
  });

  test.describe("the plugin block removed from apimatic.json", () => {
    let portal: GeneratedPortal;

    test.beforeAll(async () => {
      portal = await generateScenario("without plugin", {
        config: (config) => {
          delete config.plugin;
        },
      });
    });
    test.afterAll(() => portal?.cleanup());

    test("no context-plugin page is generated", () => {
      expect(portal.exists("context-plugin", "index.html")).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Checks shared between scenarios. They read the declared side off the
// scenario's own config, so the same check holds whatever the scenario changed.
// ---------------------------------------------------------------------------

function expectArchivesMatchDeclared(portal: GeneratedPortal) {
  const shipped = Object.keys(portal.sdkArchives()).sort();
  const expected = portal.declaredLanguages().map((l) => l.name).sort();

  // Both directions: a missing archive is a broken promise, an unexpected one
  // means the generator shipped something nobody asked for.
  expect(shipped).toEqual(expected);
}

function expectPagePerDeclaredLanguage(portal: GeneratedPortal) {
  // Collected and asserted once, so a run names every missing page.
  const missing = portal
    .declaredLanguages()
    .filter((l) => !portal.exists("sdks", l.name, "index.html"))
    .map((l) => `sdks/${l.name}/index.html`);

  expect(missing, "declared languages with no portal page").toEqual([]);
}
