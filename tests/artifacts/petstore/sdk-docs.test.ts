import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { buildDir } from "../../../utils/env.ts";
import { declaredLanguages, normalizeText, type ApimaticConfig } from "../../../utils/artifacts.ts";
import { applyChanges, type ScenarioChanges } from "../../../utils/scenario.ts";
import { authKey, generateArtifacts } from "../../../utils/portal-artifacts-api.ts";

/**
 * Stage 1: the SDK docs the Portal Artifacts API generates for the petstore
 * build, compared against committed baselines.
 *
 * Each scenario copies test-builds/petstore/src, applies its changes, uploads
 * the copy (see utils/portal-artifacts-api.ts), and compares docs/<language>.json
 * for each declared language to its baseline.
 *
 * Baselines live in portal-snapshots/artifacts/petstore/sdk-docs/<scenario>/<language>.md,
 * one folder per scenario because a change to apimatic.json changes the docs.
 * Each docs JSON is stored as markdown (one section per key) so a diff reads
 * line by line rather than as one long JSON string. Create or accept them with
 * `pnpm test:sdk-docs:update`, and review the diff before committing.
 *
 * Needs APIMATIC_AUTH_KEY (in .env locally). Every run starts a real
 * generation per scenario on that key's account.
 */

test.describe("Petstore — SDK docs from the Portal Artifacts API @artifacts", () => {
  test.skip(!authKey, "Set APIMATIC_AUTH_KEY to call the Portal Artifacts API");

  docsScenario("the build as committed", "as-committed");

  // With no publishing block there's no registry package to install, so the
  // docs have to explain installing from the SDK source instead.
  docsScenario("every language declared as an empty object", "empty-languages", {
    config: (config) => {
      for (const language of Object.keys(config.languages ?? {})) {
        config.languages![language] = {};
      }
    },
  });
});

/**
 * One scenario: copy src/, apply `changes`, upload it, and compare each
 * language's docs to the baselines in sdk-docs/<baselineDir>/.
 * One generation per scenario, shared by every test in it.
 */
function docsScenario(title: string, baselineDir: string, changes: ScenarioChanges = {}): void {
  test.describe(title, () => {
    let config: ApimaticConfig;
    /** Where the downloaded artifacts zip was extracted. */
    let artifactsDir: string;

    test.beforeAll(async ({ playwright }, testInfo) => {
      // Edit a copy in this test's output folder, never the committed build.
      const src = testInfo.outputPath("src");
      fs.cpSync(path.join(buildDir(), "src"), src, { recursive: true });
      applyChanges(src, changes);
      config = JSON.parse(fs.readFileSync(path.join(src, "apimatic.json"), "utf-8"));

      artifactsDir = await generateArtifacts(playwright, testInfo, src);
    });

    test("a docs file per declared language, and no extras", () => {
      const declared = declaredLanguages(config).map((l) => l.name).sort();
      const docsDir = path.join(artifactsDir, "docs");
      const produced = fs.existsSync(docsDir)
        ? fs.readdirSync(docsDir).filter((f) => f.endsWith(".json")).map((f) => path.basename(f, ".json")).sort()
        : [];

      const missing = declared.filter((lang) => !produced.includes(lang));
      const extra = produced.filter((lang) => !declared.includes(lang));
      expect({ missing, extra }, `declared: ${declared.join(", ")}`).toEqual({ missing: [], extra: [] });
    });

    // One test per language, so a run reports every language that changed
    // rather than stopping at the first.
    for (const language of ["typescript", "python", "csharp"]) {
      test(`${language} docs match the baseline`, () => {
        test.skip(
          !declaredLanguages(config).some((l) => l.name === language),
          `${language} isn't declared in apimatic.json`,
        );

        const file = path.join(artifactsDir, "docs", `${language}.json`);
        expect(fs.existsSync(file), `docs/${language}.json is missing from the download`).toBe(true);

        const docs = JSON.parse(fs.readFileSync(file, "utf-8"));
        expect(docsAsMarkdown(docs)).toMatchSnapshot(["sdk-docs", baselineDir, `${language}.md`]);
      });
    }
  });
}

/**
 * Turns a docs JSON into markdown for the baseline: one section per key, in
 * the order the API wrote them. A key added or dropped shows up in the diff
 * as its own section, not just a changed value.
 */
function docsAsMarkdown(docs: Record<string, unknown>): string {
  const sections = Object.entries(docs).map(([key, value]) => {
    const body = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    return `<!-- docs key: ${key} -->\n\n${body.trim()}\n`;
  });
  return normalizeText(sections.join("\n"));
}
