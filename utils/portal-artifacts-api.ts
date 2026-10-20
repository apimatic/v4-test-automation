import fs from "node:fs";
import {
  expect,
  type APIRequestContext,
  type PlaywrightWorkerArgs,
  type TestInfo,
} from "@playwright/test";
import { extractZip, zipDirectory } from "./artifacts.ts";

/**
 * The Portal Artifacts API flow, shared by the tests that check what it
 * generates (SDK docs, code samples):
 *
 *   1. zip a build's src/ and POST it to /portal-artifacts
 *   2. poll /portal-artifacts/{id}/status until it redirects (302) — done
 *   3. GET /portal-artifacts/{id}/download and unzip it
 *
 * The API runs the generator server side, so this is plain HTTP — no browser,
 * no portal served. The functional suite drives the same calls through the
 * playground; these tests only care what came back.
 *
 * Needs APIMATIC_AUTH_KEY (in .env locally). Every generation is real and runs
 * on that key's account. Set APIMATIC_API_BASE_URL to call an environment
 * other than prod, with that environment's key.
 */

/**
 * The API to call: APIMATIC_API_BASE_URL from .env locally, or from a secret
 * in CI for a dev run. Prod when unset.
 */
export const baseUrl =
  process.env.APIMATIC_API_BASE_URL?.trim().replace(/\/$/, "") || "https://api.apimatic.io";
export const authKey = process.env.APIMATIC_AUTH_KEY?.trim();

/** How long to keep polling the status before giving up. The API allows 25 minutes. */
export const GENERATION_TIMEOUT = 15 * 60_000;
const POLL_INTERVAL = 10_000;

/**
 * Uploads `srcDir`, waits for generation, and returns the folder the
 * downloaded artifacts were extracted to: `docs/`, `code-samples/`, `sdk/`.
 *
 * Call it from a `beforeAll` — one generation per scenario, shared by its
 * tests. It sets the hook's timeout to cover the whole flow. The zips and the
 * extracted folder land in the test's output folder, so a failed run leaves
 * them there to look at.
 */
export async function generateArtifacts(
  playwright: PlaywrightWorkerArgs["playwright"],
  testInfo: TestInfo,
  srcDir: string,
): Promise<string> {
  // Upload, generation and download all count against the hook's timeout.
  testInfo.setTimeout(GENERATION_TIMEOUT + 5 * 60_000);

  const buildZip = testInfo.outputPath("build-input.zip");
  zipDirectory(srcDir, buildZip);

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

    const artifactsDir = testInfo.outputPath("portal-artifacts");
    extractZip(artifactsZip, artifactsDir);
    return artifactsDir;
  } finally {
    await api.dispose();
  }
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
