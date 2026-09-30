import { test, expect } from "@playwright/test";
import {
  declaredLanguages,
  generatedExists,
  packageIdentity,
  readApimaticConfig,
  sdkArchives,
} from "../../../utils/artifacts.ts";

/**
 * Stage 1 of the pipeline: what `src/apimatic.json` DECLARED against what
 * `apimatic portal generate` actually PRODUCED.
 *
 * Filesystem checks only — no browser, no server. They run straight after
 * generation and before the portal is ever served, because a portal built
 * wrong is not worth screenshotting.
 *
 * This file is the skeleton. Each block below is a place to add cases as the
 * apimatic.json surface grows: more languages, more brand settings, the MCP
 * block, and so on.
 */

const config = readApimaticConfig();
const declared = declaredLanguages(config);

test.describe("Petstore — generated artifacts @artifacts", () => {
  test("the bundle has the entry points a static host needs", () => {
    // The CLI's own closing advice is to host these and wire 404.html as the
    // error document, so their absence breaks deployment rather than looks.
    expect(generatedExists("index.html"), "index.html").toBe(true);
    expect(generatedExists("404.html"), "404.html — the error document").toBe(true);
  });

  test("one SDK archive per declared language, and no extras", () => {
    const shipped = Object.keys(sdkArchives()).sort();
    const expected = declared.map((l) => l.name).sort();

    // Both directions: a missing archive is a broken promise, an unexpected one
    // means the generator shipped something nobody asked for.
    expect(shipped).toEqual(expected);
  });

  test("each declared language gets a portal page", () => {
    for (const language of declared) {
      expect(
        generatedExists("sdks", language.name, "index.html"),
        `sdks/${language.name}/index.html should exist for a declared language`,
      ).toBe(true);
    }
  });

  test("each SDK ships the package identity that was declared", () => {
    // KNOWN DEFECT — expected to fail until publishing.package.version reaches
    // the SDK manifests. apimatic.json declares typescript 2.4.0, python 1.0.3
    // and csharp 3.1.2; the archives ship 1.0.26, 1.0.26 and no <Version>
    // element at all. Package names are correct in all three.
    //
    // Marked expected-to-fail rather than deleted or loosened, so it keeps
    // reporting the mismatch without turning CI red for everything else — and
    // Playwright will flag it the moment it starts passing, i.e. when it's
    // fixed. Remove this line then.
    test.fail();

    const mismatches: string[] = [];

    for (const language of declared) {
      const identity = packageIdentity(language.name, sdkArchives()[language.name]);
      if (!identity) {
        mismatches.push(`${language.name}: no recognisable package manifest in the archive`);
        continue;
      }
      if (language.packageName && identity.packageName !== language.packageName) {
        mismatches.push(
          `${language.name}: ${identity.manifest} name is "${identity.packageName}", declared "${language.packageName}"`,
        );
      }
      if (language.version && identity.version !== language.version) {
        // A manifest with no version at all is a different defect from one
        // carrying the wrong version, so the message says which it is.
        mismatches.push(
          identity.version === null
            ? `${language.name}: ${identity.manifest} carries no version element at all, declared "${language.version}"`
            : `${language.name}: ${identity.manifest} version is "${identity.version}", declared "${language.version}"`,
        );
      }
    }

    // Collected rather than asserted per language, so one run reports every
    // mismatch instead of stopping at the first.
    expect(mismatches, `\n  ${mismatches.join("\n  ")}\n`).toEqual([]);
  });

  test("the plugin block produces a context-plugin page", () => {
    test.skip(!config.plugin, "no plugin declared in apimatic.json");
    expect(generatedExists("context-plugin", "index.html")).toBe(true);
  });
});
