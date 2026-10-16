import fs from "node:fs";
import path from "node:path";
import { test, expect, type Request } from "@playwright/test";
import { ApiReferencePage } from "../../../pages/ApiReferencePage.ts";
import { buildDir, portalConfig, portalName } from "../../../utils/env.ts";
import { zipDirectory, zipEntries } from "../../../utils/artifacts.ts";

/**
 * Stage 3: the Portal Artifacts flow, run through the API reference playground
 * against the real https://api.apimatic.io (the spec's only server).
 *
 *   1. Generate Portal Artifacts Async   upload a build zip, get back an id
 *   2. Get ... Generation Status         poll that id until it's done
 *   3. Download Generated ... Artifacts  fetch the zip it produced
 *
 * The build uploaded is this build's own src/ — a real build input, and its
 * apimatic.json says which languages the download must contain.
 *
 * Needs APIMATIC_AUTH_KEY (in .env locally). Every run starts a real
 * generation on that key's account.
 */

const authKey = process.env.APIMATIC_AUTH_KEY?.trim();

/**
 * Checks the request carried the key, without the key ending up in a failure
 * message — reports are uploaded as CI artifacts, where GitHub doesn't mask it.
 */
function expectKeySent(request: Request): void {
  const sent = request.headers()["authorization"];
  expect(sent === `X-Auth-Key ${authKey}`, `Authorization header was ${
    sent === undefined ? "not sent" : "sent with the wrong value"
  }`).toBe(true);
}

/** How long to keep polling the status before giving up. The API allows 25 minutes. */
const GENERATION_TIMEOUT = 15 * 60_000;
const POLL_INTERVAL = 10_000;

// No trace: it would record the key typed into the playground.
test.use({ trace: "off" });

test.describe("APIMatic — Portal Artifacts flow @apimatic", () => {
  test.skip(portalName() !== "apimatic", "Run with PORTAL=apimatic");
  test.skip(!authKey, "Set APIMATIC_AUTH_KEY to call api.apimatic.io");

  // The key is typed into the playground, so keep it out of what's saved on
  // failure: the snapshot (taken when the context closes, after afterEach)
  // sees a blank page instead of the filled form. Trace is off file-wide, above.
  test.afterEach(async ({ page }) => {
    await page.goto("about:blank");
  });

  const { routes } = portalConfig();

  test("generate, poll status and download artifacts for an uploaded build", async ({
    page,
  }, testInfo) => {
    test.setTimeout(GENERATION_TIMEOUT + 5 * 60_000);

    const authorization = `X-Auth-Key ${authKey}`;
    const src = path.join(buildDir(), "src");
    const declared = JSON.parse(
      fs.readFileSync(path.join(src, "apimatic.json"), "utf-8"),
    );
    const languages = Object.keys(declared.languages ?? {});

    const buildZip = testInfo.outputPath("build-input.zip");
    zipDirectory(src, buildZip);

    const api = new ApiReferencePage(page);
    let id = "";

    await test.step("1. Generate Portal Artifacts Async — upload the build", async () => {
      await api.open(routes.apiGenerateArtifacts);
      await api.fillAuthField("Authorization", "header", authorization);
      await api.uploadBodyFile(buildZip);

      const response = await api.sendRequest();

      // What went over the wire: the key, and the zip as multipart form data.
      const sent = response.request();
      expect(sent.method()).toBe("POST");
      expectKeySent(sent);
      expect(sent.headers()["content-type"]).toMatch(/^multipart\/form-data/);
      // A cleared field still goes out, as an empty header.

      // What came back: accepted, with an id and links built from it.
      expect(response.status(), await response.text()).toBe(202);
      const body = await response.json();
      id = body.id;
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
      expect(body.links.status).toBe(
        `https://api.apimatic.io/portal-artifacts/${id}/status`,
      );
      expect(body.links.download).toBe(
        `https://api.apimatic.io/portal-artifacts/${id}/download`,
      );

      await expect(api.responseStatus).toHaveText(/^202\b/);
    });

    await test.step("2. Get Portal Artifacts Generation Status — poll until done", async () => {
      await api.open(routes.apiArtifactsStatus);
      await api.fillAuthField("Authorization", "header", authorization);
      await api.fillParameter("Path", "id", id);

      // While it runs: 200 { status: "InProgress" }. Once it's done: 302 to
      // the download. The browser follows it, so the playground shows the
      // download's 200, but sendRequest() returns the 302 that came first.
      const deadline = Date.now() + GENERATION_TIMEOUT;
      let outcome = "InProgress";
      while (outcome === "InProgress") {
        expect(
          Date.now(),
          "generation still InProgress after the timeout",
        ).toBeLessThan(deadline);

        const response = await api.sendRequest();
        expectKeySent(response.request());

        if (response.status() === 302) {
          // Done: the API redirects to the download. Playwright hands us the
          // redirect itself, which has no body, so check where it points.
          expect(await response.headerValue("location")).toBe(
            `https://api.apimatic.io/portal-artifacts/${id}/download`,
          );
          outcome = "Completed";
        } else if (response.status() !== 200) {
          outcome = `HTTP ${response.status()}: ${await response.text()}`;
        } else if (
          response.headers()["content-type"]?.includes("application/zip")
        ) {
          outcome = "Completed";
        } else {
          // InProgress, or Failed / ValidationError / SubscriptionError.
          const body = await response.json();
          outcome = body.errors
            ? `${body.status} ${JSON.stringify(body.errors)}`
            : body.status;
        }

        if (outcome === "InProgress") await page.waitForTimeout(POLL_INTERVAL);
      }

      expect(outcome).toBe("Completed");
      await expect(api.responseStatus).toHaveText(/^200\b/);
    });

    await test.step("3. Download Generated Portal Artifacts — fetch the zip", async () => {
      await api.open(routes.apiArtifactsDownload);
      await api.fillAuthField("Authorization", "header", authorization);
      await api.fillParameter("Path", "id", id);

      const response = await api.sendRequest();

      expect(new URL(response.url()).pathname).toBe(
        `/portal-artifacts/${id}/download`,
      );
      expectKeySent(response.request());
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/zip");

      // The zip holds an SDK, code samples and a guide per declared language.
      const artifactsZip = testInfo.outputPath("portal-artifacts.zip");
      fs.writeFileSync(artifactsZip, await response.body());
      const entries = zipEntries(artifactsZip);
      const missing = languages.flatMap((lang) =>
        [
          `sdk/${lang}.zip`,
          `code-samples/${lang}.json`,
          `docs/${lang}.json`,
        ].filter((entry) => !entries.includes(entry)),
      );
      expect(missing, `zip entries: ${entries.join(", ")}`).toEqual([]);

      await expect(api.responseStatus).toHaveText(/^200\b/);
    });
  });
});
