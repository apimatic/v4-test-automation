import { test, expect } from "@playwright/test";
import { DocsPage } from "../../../pages/DocsPage.ts";
import { portalConfig } from "../../../utils/env.ts";
import { snapshotOptions } from "../../../utils/visual.ts";

/**
 * Visual regression for the Slack customer build of the dxV2 docs portal.
 *
 * The portal is generated and served by scripts/serve-portal.mts, which runs the
 * same stages you'd run by hand from the repo root:
 *
 *   pnpm generate-docs -- --customer-build ./test-builds/slack
 *   pnpm build
 *   pnpm start
 *
 * Baselines: dxv2-portal-snapshots/dxv2-visual/slack/
 * Update them with `pnpm test:visual:update` after an intentional UI change,
 * and review the diff images before committing.
 */

const { routes } = portalConfig();

test.describe("Slack portal — visual @slack", () => {
  test("Getting Started (generated Quickstart) — light", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);

    expect(await docs.colorMode()).toBe("light");
    await expect(page).toHaveScreenshot("quickstart-light.png", snapshotOptions(page));
  });

  test("Getting Started (generated Quickstart) — dark", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);
    await docs.toggleColorMode();

    expect(await docs.colorMode()).toBe("dark");
    await expect(page).toHaveScreenshot("quickstart-dark.png", snapshotOptions(page));
  });

  test("Guide page renders authored markdown — light", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.guideQuickstart);

    await expect(page).toHaveScreenshot("guide-quickstart-light.png", snapshotOptions(page));
  });

  test("Endpoint page with playground — light", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.endpoint);

    // The playground is the riskiest thing on the page — assert it's actually
    // there before trusting a green screenshot.
    await expect(docs.pageContent.getByRole("tablist")).toBeVisible();
    await expect(page).toHaveScreenshot("endpoint-playground-light.png", snapshotOptions(page));
  });

  test("Endpoint page with playground — dark", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.endpoint);
    await docs.toggleColorMode();

    await expect(page).toHaveScreenshot("endpoint-playground-dark.png", snapshotOptions(page));
  });

  test("SDKs section overview", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.sdks);

    await expect(page).toHaveScreenshot("sdks-overview-light.png", snapshotOptions(page));
  });

  test("MCP section overview", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.mcp);

    await expect(page).toHaveScreenshot("mcp-overview-light.png", snapshotOptions(page));
  });

  test("Portal chrome — header and section nav", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);

    // Element-scoped: catches a broken logo, version badge or nav tab without
    // failing every time page content changes.
    await expect(docs.header).toHaveScreenshot("portal-header.png", {
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    });
  });

  test("Sidebar navigation tree — API Reference", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.endpoint);

    await expect(docs.sidebar).toHaveScreenshot("sidebar-api-reference.png", {
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    });
  });

  test("Sidebar collapsed", async ({ page }) => {
    const docs = new DocsPage(page);
    // Quickstart's sidebar isn't collapsible, so the header renders no collapse
    // control there — take this one on an API Reference page.
    await docs.open(routes.endpoint);
    await docs.collapseSidebar();

    await expect(page).toHaveScreenshot("endpoint-sidebar-collapsed.png", snapshotOptions(page));
  });

  test("Search overlay", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);
    await docs.openSearch();

    await expect(docs.searchDialog).toBeVisible();
    await expect(page).toHaveScreenshot("search-overlay-light.png", snapshotOptions(page));
  });
});
