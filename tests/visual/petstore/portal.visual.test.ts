import { test, expect } from "@playwright/test";
import { DocsPage } from "../../../pages/DocsPage.ts";
import { portalConfig } from "../../../utils/env.ts";
import { snapshotOptions } from "../../../utils/visual.ts";

/**
 * Stage 2: how the served portal looks.
 *
 * The portal is generated and served by scripts/serve-portal.mts — the same two
 * commands you'd run by hand:
 *
 *   apimatic portal generate --input test-builds/petstore
 *   http-server -c-1 --cors            (inside test-builds/petstore/portal)
 *
 * The set is chosen to cover each distinct render path the build exercises
 * rather than to cover many pages: authored markdown, the MDX component set,
 * GFM, the pages generated from the `languages` and `plugin` blocks of
 * apimatic.json, the API reference, and the chrome around all of them.
 *
 * Baselines: portal-snapshots/visual/petstore/
 * Update with `pnpm test:visual:update` after an intentional change, and look
 * at the diff images before committing them.
 */

const { routes } = portalConfig();

test.describe("Petstore v4 portal — visual @petstore", () => {
  // ---- the shell ---------------------------------------------------------

  test("landing page", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.home);

    // Paired with a real assertion: a screenshot alone can pass on a page that
    // rendered the wrong thing but rendered it stably.
    expect(await docs.isPortalChromeDisplayed()).toBe(true);
    await expect(page).toHaveScreenshot("home.png", snapshotOptions(page));
  });

  test("landing page — dark", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.home);
    await docs.setColorMode("dark");

    // apimatic.json sets brand.colorMode "both", so dark is a supported mode
    // rather than an accident — and it has its own declared primary colour.
    expect(await docs.colorMode()).toBe("dark");
    await expect(page).toHaveScreenshot("home-dark.png", snapshotOptions(page));
  });

  test("top bar", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.home);

    // Element-scoped: catches a broken logo, a missing nav link or a mangled
    // search pill without failing every time page content changes. All seven
    // links here come from apimatic.json's navigation block.
    await expect(docs.subnav).toHaveScreenshot("subnav.png", {
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    });
  });

  test("sidebar tree — deeply nested guides", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.guideWebhooks);

    // The build nests guides/webhooks/delivery/retries/backoff/jitter/tuning on
    // purpose, so this is the case that would catch a broken nav tree.
    await expect(docs.sidebar).toHaveScreenshot("sidebar-guides.png", {
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    });
  });

  // ---- authored content --------------------------------------------------

  test("authored guide page", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.guideAuthentication);

    await expect(docs.pageHeading).toHaveText(/Authentication/i);
    await expect(page).toHaveScreenshot("guide-authentication.png", snapshotOptions(page));
  });

  test("component showcase — accordions", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.componentAccordions);

    // MDX components are a different render path from plain markdown.
    await expect(page).toHaveScreenshot("component-accordions.png", snapshotOptions(page));
  });

  test("component showcase — tabs", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.componentTabs);

    await expect(page).toHaveScreenshot("component-tabs.png", snapshotOptions(page));
  });

  test("GFM rendering — tables", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.gfmTables);

    // A table that silently lost a column would still screenshot stably, so
    // assert the table is there before trusting the pixels.
    await expect(docs.pageContent.getByRole("table").first()).toBeVisible();
    await expect(page).toHaveScreenshot("gfm-tables.png", snapshotOptions(page));
  });

  // ---- pages generated from apimatic.json --------------------------------

  test("SDKs index", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.sdks);

    await expect(page).toHaveScreenshot("sdks.png", snapshotOptions(page));
  });

  test("SDK page — TypeScript", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.sdkTypescript);

    // One page per language in the `languages` block; this is the render of the
    // declared package identity and install instructions.
    await expect(docs.pageHeading).toHaveText(/TypeScript/i);
    await expect(page).toHaveScreenshot("sdk-typescript.png", snapshotOptions(page));
  });

  test("context plugin page", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.contextPlugin);

    // Generated from the `plugin` block.
    await expect(page).toHaveScreenshot("context-plugin.png", snapshotOptions(page));
  });

  test("API reference — endpoint page", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.apiEndpoint);

    // Generated from src/spec/petstore.json — 19 operations across three tags.
    await expect(page).toHaveScreenshot("api-add-pet.png", snapshotOptions(page));
  });

  // ---- interaction and layout --------------------------------------------

  test("search overlay with results", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.home);
    await docs.searchFor("pet");

    expect(await docs.searchResultsMatching("pet").count()).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot("search-results.png", snapshotOptions(page));
  });

  test("mobile viewport", async ({ page }) => {
    const docs = new DocsPage(page);
    // A different layout, not just a narrower one: the top bar collapses to its
    // icon-only variants and the sidebar becomes a page selector.
    await page.setViewportSize({ width: 390, height: 844 });
    await docs.open(routes.guideAuthentication);

    await expect(page).toHaveScreenshot("guide-authentication-mobile.png", snapshotOptions(page));
  });
});
