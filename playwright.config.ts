import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { baseURL, portalPort, usingExternalPortal } from "./utils/env.ts";

dotenv.config({ quiet: true });

/**
 * v4 test automation — three suites over a portal produced by
 * `apimatic portal generate`.
 *
 *   artifacts   what the CLI PRODUCED vs what src/apimatic.json DECLARED.
 *               Filesystem only, no browser, no server.
 *   visual      how the served portal LOOKS, against committed baselines.
 *   functional  what the served portal DOES — navigation, search, downloads.
 *
 * The split matters: artifacts catch a portal built wrong (an SDK missing, a
 * version that didn't take), visual catches one that renders wrong, functional
 * catches one that renders fine and behaves wrong. None substitutes for another.
 *
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",

  /* Fail the build if a test.only was left in the source. */
  forbidOnly: !!process.env.CI,

  /**
   * No retries, anywhere. A test that only passes on a second attempt is
   * telling you it's unstable, and retrying hides the signal these suites
   * exist to surface.
   */
  retries: 0,

  /* The browser suites share one server; serially keeps snapshots stable. */
  workers: 1,

  reporter: process.env.CI ? [["html"], ["github"]] : "html",

  /* Baselines live in the repo, grouped by project and by build (the test's own
     folder), e.g. portal-snapshots/visual/petstore/home-light.png */
  snapshotPathTemplate: "portal-snapshots/{projectName}/{testFileDir}/{arg}{ext}",

  timeout: 120_000,
  expect: { timeout: 30_000 },

  use: {
    baseURL: baseURL(),
    trace: "retain-on-failure",
  },

  projects: [
    {
      /**
       * Reads the generated bundle off disk. It needs the portal generated but
       * not served — it runs happily before the web server is up, and doesn't
       * launch a browser at all.
       */
      name: "artifacts",
      testDir: "./tests/artifacts",
    },
    {
      name: "visual",
      testDir: "./tests/visual",
      use: {
        ...devices["Desktop Chrome"],
        /* Pinned so snapshots don't shift with whatever window the runner has. */
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "functional",
      testDir: "./tests/functional",
      use: {
        ...devices["Desktop Chrome"],
        /* Same viewport as the visual project. Desktop Chrome's default 1280
           pushes the theme control off-canvas, so a behaviour test would fail
           on layout rather than on behaviour. */
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  /**
   * Generate the portal and serve it, unless PORTAL_BASE_URL points at one
   * that's already hosted.
   *
   * Playwright owns the server process on purpose: a server started in its own
   * CI step doesn't survive, because the Windows runner tears down a step's
   * process tree when the step ends.
   *
   * PORTAL_PREBUILT is for CI, where generation is its own step so its log and
   * timing stand alone; this then only has to serve.
   */
  webServer: usingExternalPortal()
    ? undefined
    : {
        command: process.env.PORTAL_PREBUILT
          ? "node scripts/serve-portal.mts --no-generate"
          : "node scripts/serve-portal.mts",
        url: `http://127.0.0.1:${portalPort()}/`,
        /* CLI generation plus http-server coming up, from cold. */
        timeout: 300_000,
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
      },
});
