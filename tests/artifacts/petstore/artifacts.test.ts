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
      expect(portal.exists("404.html"), "404.html — the error document").toBe(
        true,
      );
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
      expect(
        portal.exists("__downloads", "plugin.zip"),
        "__downloads/plugin.zip",
      ).toBe(true);

      const sdkEntries = zipEntries(archive).filter((entry) =>
        entry.split("/").some((segment) => /^sdks?$/i.test(segment)),
      );
      expect(sdkEntries, "plugin.zip entries inside an sdk/ directory").toEqual(
        [],
      );
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
      expect(portal.readNormalized("llms-full.txt")).toMatchSnapshot(
        "llms-full.txt",
      );
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
        ...new Set(
          entries
            .filter((e) => e.startsWith("sdk/"))
            .map((e) => e.split("/")[1]),
        ),
      ]
        .filter(Boolean)
        .sort();

      // Both directions: a missing sdk/ folder leaves the agent nothing to
      // install, an extra one ships source for a language that has a package.
      expect(bundled, "sdk/ folders in plugin.zip").toEqual(unpublished);
    });

    test("the bundled SDK carries its package manifest", () => {
      // A folder holding only docs isn't an installable SDK.
      expect(
        entries,
        `plugin.zip should contain sdk/${emptied}/pyproject.toml`,
      ).toContain(`sdk/${emptied}/pyproject.toml`);
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

  test.describe("pluginUrl set alongside the plugin block", () => {
    // A hosted plugin: the portal should point at it rather than bundle its own
    // copy. Petstore has a plugin block but no pluginUrl, so this adds one.
    const pluginUrl = "https://plugins.example.com/petstore";
    let portal: GeneratedPortal;

    test.beforeAll(async () => {
      portal = await generateScenario("with pluginUrl", {
        config: (config) => {
          config.portal!.pluginUrl = pluginUrl;
        },
      });
    });
    test.afterAll(() => portal?.cleanup());

    test("the hosted plugin URL is used as given, and no plugin.zip is bundled", () => {
      // Read the declared side off the scenario's own apimatic.json.
      const declared = portal.config().portal?.pluginUrl;
      expect(declared, "portal.pluginUrl in the scenario's apimatic.json").toBe(
        pluginUrl,
      );

      // Collected and asserted once, so a run reports every problem.
      const problems: string[] = [];

      // The Context Plugin page's install command, in the page and in its
      // markdown copy. "As given" means character for character.
      for (const file of ["context-plugin/index.html", "context-plugin.md"]) {
        const segments = file.split("/");
        if (!portal.exists(...segments)) {
          problems.push(`${file} is missing`);
          continue;
        }
        // The HTML writes the quotes around the URL as &quot;.
        const text = portal.read(...segments).replace(/&quot;/g, '"');
        const installFrom = text.match(/\binstall\s+"([^"]+)"/)?.[1];
        if (installFrom === undefined)
          problems.push(`${file} has no install command`);
        else if (installFrom !== declared)
          problems.push(`${file} installs from "${installFrom}"`);
      }

      // Hosted means the portal carries no copy of its own.
      if (portal.exists("__downloads", "plugin.zip")) {
        problems.push("__downloads/plugin.zip was bundled anyway");
      }

      expect(problems, `pluginUrl ${declared}`).toEqual([]);
    });

    test("the Context Plugin page is still generated", () => {
      // The page comes from the plugin block; pluginUrl only changes where the
      // plugin installs from, so the page must survive it.
      expect(
        portal.config().plugin,
        "the plugin block in the scenario's apimatic.json",
      ).toBeTruthy();
      expect(
        portal.exists("context-plugin", "index.html"),
        "context-plugin/index.html",
      ).toBe(true);
    });
  });

  test.describe("packageConfiguration without package", () => {
    // Package details but no published version: there's nothing on a registry
    // to install, so the portal must not offer an install command or a link.
    const language = "csharp";
    let portal: GeneratedPortal;

    test.beforeAll(async () => {
      // generateScenario throws if the CLI fails, so getting past here means it built.
      portal = await generateScenario(`${language} without package`, {
        config: (config) => {
          const entry = config.languages![language] as {
            publishing: { package?: unknown };
          };
          delete entry.publishing.package;
        },
      });
    });
    test.afterAll(() => portal?.cleanup());

    test("the portal builds, with no install command or registry link", () => {
      // Read the declared side off the scenario's own apimatic.json.
      const declared = portal
        .declaredLanguages()
        .find((l) => l.name === language);
      expect(
        declared?.version,
        `${language} publishing.package should be gone`,
      ).toBeUndefined();
      const packageName = declared?.packageName;
      expect(
        packageName,
        `${language} packageConfiguration still names the package`,
      ).toBeTruthy();

      // Collected and asserted once, so a run reports every problem.
      const problems: string[] = [];

      // It built: the language still has its page and its card on the overview.
      const pagePath = ["sdks", language, "index.html"];
      const pageHtml = portal.exists(...pagePath)
        ? portal.read(...pagePath)
        : undefined;
      const card = sdkCardHtml(portal, language);
      if (pageHtml === undefined)
        problems.push(`${pagePath.join("/")} is missing`);
      if (card === undefined)
        problems.push(`no ${language} card on sdks/index.html`);

      // No install command: a card shows one as a code block.
      const installCommand = card?.match(
        /<code\b[^>]*>([\s\S]*?)<\/code>/,
      )?.[1];
      if (installCommand !== undefined) {
        problems.push(
          `the card shows an install command: "${textOf(installCommand)}"`,
        );
      }

      // No registry link: npm, PyPI and NuGet all put the package name in the URL.
      const places: Array<[string, string | undefined]> = [
        ["the card", card],
        [pagePath.join("/"), pageHtml],
      ];
      for (const [where, html] of places) {
        for (const link of links(html ?? "")) {
          if (link.href.includes(packageName!)) {
            problems.push(
              `${where} links to a registry: "${link.text}" → ${link.href}`,
            );
          }
        }
      }

      expect(
        problems,
        `${language} with packageConfiguration but no package`,
      ).toEqual([]);
    });
  });

  test.describe("source.repositoryUrl and branch set", () => {
    // TypeScript has a repositoryUrl but no branch in petstore, so this sets
    // one. Petstore's python and csharp declare branches too; the test checks
    // every language that declares one, not just this one.
    const language = "typescript";
    const branch = "release/2.x";
    let portal: GeneratedPortal;

    test.beforeAll(async () => {
      portal = await generateScenario(`${language} on branch ${branch}`, {
        config: (config) => {
          const entry = config.languages![language] as {
            publishing: { source: { branch?: string } };
          };
          entry.publishing.source.branch = branch;
        },
      });
    });
    test.afterAll(() => portal?.cleanup());

    test.skip("View source points at the declared branch", () => {
      // Read the declared side off the scenario's own apimatic.json.
      const withBranch = portal
        .declaredLanguages()
        .filter((l) => l.repositoryUrl && l.branch);
      expect(
        withBranch.map((l) => l.name),
        "languages declaring both repositoryUrl and branch",
      ).toContain(language);

      // Collected and asserted once, so a run names every language that's wrong.
      const problems: string[] = [];
      for (const { name, repositoryUrl, branch } of withBranch) {
        const pagePath = ["sdks", name, "index.html"];
        if (!portal.exists(...pagePath)) {
          problems.push(`${pagePath.join("/")} is missing`);
          continue;
        }
        const href = links(portal.read(...pagePath)).find(
          (l) => l.text === "View source",
        )?.href;
        // Host-agnostic (GitHub /tree/<branch>, GitLab /-/tree/<branch>, …):
        // the link must stay inside the repository and end at the branch.
        const repo = repositoryUrl!.replace(/\/$/, "");
        if (href === undefined) {
          problems.push(
            `${name}: sdks/${name}/index.html has no View source link`,
          );
        } else if (
          !href.startsWith(`${repo}/`) ||
          !href.replace(/\/$/, "").endsWith(`/${branch}`)
        ) {
          problems.push(
            `${name}: View source is "${href}", expected branch "${branch}" of ${repo}`,
          );
        }
      }

      expect(problems).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// Checks shared between scenarios. They read the declared side off the
// scenario's own config, so the same check holds whatever the scenario changed.
// ---------------------------------------------------------------------------

function expectArchivesMatchDeclared(portal: GeneratedPortal) {
  const shipped = Object.keys(portal.sdkArchives()).sort();
  const expected = portal
    .declaredLanguages()
    .map((l) => l.name)
    .sort();

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

/** Every <a> in a piece of HTML, as its href and visible text. */
function links(html: string): Array<{ href: string; text: string }> {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(
    ([, attributes, inner]) => ({
      href: attributes.match(/\bhref="([^"]*)"/)?.[1] ?? "",
      text: textOf(inner),
    }),
  );
}

/** The text of an HTML fragment: tags (and React's <!-- --> markers) dropped, spaces collapsed. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * One language's card on sdks/index.html, as HTML. Each card is an <article>
 * holding a link to its language's page, /sdks/<language>.
 */
function sdkCardHtml(
  portal: GeneratedPortal,
  language: string,
): string | undefined {
  if (!portal.exists("sdks", "index.html")) return undefined;
  return portal
    .read("sdks", "index.html")
    .split(/<article\b/)
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf("</article>")))
    .find((card) =>
      links(card).some((link) => link.href === `/sdks/${language}`),
    );
}
