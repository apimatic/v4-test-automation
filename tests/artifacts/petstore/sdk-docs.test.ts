import fs from "node:fs";
import path from "node:path";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { buildDir } from "../../../utils/env.ts";
import {
  declaredLanguages,
  extractZip,
  normalizeText,
  zipDirectory,
  type ApimaticConfig,
} from "../../../utils/artifacts.ts";
import { applyChanges, type ScenarioChanges } from "../../../utils/scenario.ts";

/**
 * Stage 1: the SDK docs the Portal Artifacts API generates for the petstore
 * build, compared against committed baselines.
 *
 *   1. copy test-builds/petstore/src, apply the scenario's changes, zip it
 *      and POST it to /portal-artifacts
 *   2. poll /portal-artifacts/{id}/status until it redirects (302) — done
 *   3. GET /portal-artifacts/{id}/download and unzip it
 *   4. compare docs/<language>.json for each declared language to its baseline
 *
 * The API runs the same generator the CLI does, but server side, so this is a
 * plain HTTP flow — no browser, no portal served. The functional suite drives
 * the same calls through the playground; this one only cares what came back.
 *
 * Baselines live in portal-snapshots/artifacts/petstore/sdk-docs/<scenario>/<language>.md,
 * one folder per scenario because a change to apimatic.json changes the docs.
 * Each docs JSON is stored as markdown (one section per key) so a diff reads
 * line by line rather than as one long JSON string. Create or accept them with
 * `pnpm test:sdk-docs:update`, and review the diff before committing.
 *
 * Needs APIMATIC_AUTH_KEY (in .env locally). Every run starts a real
 * generation on that key's account. Set APIMATIC_API_BASE_URL to call an
 * environment other than prod, with that environment's key.
 */

/**
 * The API to call: APIMATIC_API_BASE_URL from .env locally, or from a secret
 * in CI for a dev run. Prod when unset.
 */
const baseUrl =
  process.env.APIMATIC_API_BASE_URL?.trim().replace(/\/$/, "") || "https://api.apimatic.io";
const authKey = process.env.APIMATIC_AUTH_KEY?.trim();

/** How long to keep polling the status before giving up. The API allows 25 minutes. */
const GENERATION_TIMEOUT = 15 * 60_000;
const POLL_INTERVAL = 10_000;

test.describe("Petstore — SDK docs from the Portal Artifacts API @artifacts", () => {
  test.skip(!authKey, "Set APIMATIC_AUTH_KEY to call api.apimatic.io");

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
      // Upload, generation and download all count against the hook's timeout.
      testInfo.setTimeout(GENERATION_TIMEOUT + 5 * 60_000);

      // Edit a copy in this test's output folder, never the committed build.
      const src = testInfo.outputPath("src");
      fs.cpSync(path.join(buildDir(), "src"), src, { recursive: true });
      applyChanges(src, changes);
      config = JSON.parse(fs.readFileSync(path.join(src, "apimatic.json"), "utf-8"));

      const buildZip = testInfo.outputPath("build-input.zip");
      zipDirectory(src, buildZip);

      const api = await playwright.request.newContext({
        extraHTTPHeaders: { Authorization: `X-Auth-Key ${authKey}` },
      });
      try {
        const id = await startGeneration(api, buildZip);
        await waitForGeneration(api, id);

        const download = await api.get(`${baseUrl}/portal-artifacts/${id}/download`);
        expect(download.status(), "download status").toBe(200);
        const artifactsZip = testInfo.outputPath("portal-artifacts.zip");
        fs.writeFileSync(artifactsZip, await download.body());

        artifactsDir = testInfo.outputPath("portal-artifacts");
        extractZip(artifactsZip, artifactsDir);
      } finally {
        await api.dispose();
      }
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

/** POSTs the build zip and returns the generation id. */
async function startGeneration(api: APIRequestContext, buildZip: string): Promise<string> {
  const response = await api.post(`${baseUrl}/portal-artifacts`, {
    multipart: {
      file: {
        name: "build-input.zip",
        mimeType: "application/zip",
        buffer: fs.readFileSync(buildZip),
      },
    },
  });
  expect(response.status(), await response.text()).toBe(202);
  const { id } = await response.json();
  expect(id).toMatch(/^[0-9a-f-]{36}$/);
  return id;
}

/**
 * Polls the status until generation completes. While it runs the API answers
 * 200 { status: "InProgress" }; once done it answers 302 to the download.
 * Redirects aren't followed, so the 302 is what we see.
 */
async function waitForGeneration(api: APIRequestContext, id: string): Promise<void> {
  const deadline = Date.now() + GENERATION_TIMEOUT;
  while (true) {
    const response = await api.get(`${baseUrl}/portal-artifacts/${id}/status`, { maxRedirects: 0 });
    if (response.status() === 302) return;

    expect(response.status(), await response.text()).toBe(200);
    // Failed / ValidationError / SubscriptionError come back as 200 too.
    const body = await response.json();
    expect(body.status, JSON.stringify(body.errors ?? {})).toBe("InProgress");
    expect(Date.now(), "generation still InProgress after the timeout").toBeLessThan(deadline);

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
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
