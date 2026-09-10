import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { baseURL, portalPort, usingExternalPortal } from "./utils/env.ts";

dotenv.config({ quiet: true });

/**
 * dxV2 test automation — visual and (later) functional tests for the
 * apimatic-dx-portal-v2 docs portal.
 *
 * The portal under test is generated and served out of a local clone of
 * apimatic/apimatic-dx-portal-v2; see .env.example and scripts/serve-portal.mts.
 *
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",

  /* Fail the build if a test.only was left in the source. */
  forbidOnly: !!process.env.CI,

  /**
   * No retries, anywhere. A visual test that only passes on a second attempt is
   * telling you the snapshot is unstable, and a retry hides exactly the signal
   * this suite exists to surface. The portal is served from a prerendered build,
   * so there's no cold-compile flakiness left to paper over either.
   */
  retries: 0,

  /* Visual tests share one dev server; running them serially keeps the
     screenshots stable and avoids compile-storming the server. */
  workers: 1,

  reporter: process.env.CI ? [["html"], ["github"]] : "html",

  /* Baselines live in the repo, grouped by project and by portal (the test's
     own folder), e.g. dxv2-portal-snapshots/dxv2-visual/slack/quickstart.png */
  snapshotPathTemplate: "dxv2-portal-snapshots/{projectName}/{testFileDir}/{arg}{ext}",

  /* The dev server compiles routes on demand, so first hits are slow. */
  timeout: 120_000,
  expect: { timeout: 30_000 },

  use: {
    baseURL: baseURL(),
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "dxv2-visual",
      testDir: "./tests/visual",
      use: {
        ...devices["Desktop Chrome"],
        /* Pinned so snapshots don't shift with whatever window the runner has. */
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    {
      /* Placeholder for the functional suite — tests/functional/ is empty for now. */
      name: "dxv2-functional",
      testDir: "./tests/functional",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /**
   * Generate, build and serve the portal, unless PORTAL_BASE_URL points at
   * something already up.
   *
   * Playwright owns the server process on purpose. Starting it in its own CI
   * step and polling for it does not work: the Windows runner tears down a
   * step's process tree when the step ends, so the server was gone before the
   * tests ran — it reported "Ready", then every request was refused. Playwright
   * keeps the server as a child of the test run and shuts it down afterwards.
   *
   * PORTAL_PREBUILT is for CI, where generate and build are their own steps (so
   * their logs and timings stand alone); this then only has to serve.
   */
  webServer: usingExternalPortal()
    ? undefined
    : {
        command: process.env.PORTAL_PREBUILT
          ? "node scripts/serve-portal.mts --no-generate --no-build"
          : "node scripts/serve-portal.mts",
        /* 127.0.0.1 to match --hostname 0.0.0.0; `localhost` can be ::1-only. */
        url: `http://127.0.0.1:${portalPort()}/docs/getting-started/quickstart`,
        /* Generate + next build + server start, from cold. */
        timeout: 600_000,
        /* Locally, reuse a portal you already have running. */
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
      },
});
