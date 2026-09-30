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
    expect(generatedExists("404.html"), "404.html — the error document").toBe(
      true,
    );
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

  test("the plugin block produces a context-plugin page", () => {
    test.skip(!config.plugin, "no plugin declared in apimatic.json");
    expect(generatedExists("context-plugin", "index.html")).toBe(true);
  });
});
