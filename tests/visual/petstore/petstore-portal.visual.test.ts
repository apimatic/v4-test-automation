import { test, expect } from "@playwright/test";
import { DocsPage } from "../../../pages/DocsPage.ts";
import { portalConfig } from "../../../utils/env.ts";
import { snapshotOptions } from "../../../utils/visual.ts";

/**
 * Visual regression for the petstore build of the dxV2 docs portal.
 *
 * The portal is generated and served by scripts/serve-portal.mts, which runs the
 * same stages you'd run by hand from the repo root:
 *
 *   pnpm generate-docs -- --customer-build ./test-builds/petstore
 *   pnpm build
 *   pnpm start
 *
 * This build exercises different ground from a hand-written one: the whole
 * portal is generated from a spec, so the Models pages and the endpoint
 * playground are the substance, and there is exactly one authored markdown page.
 * It also carries a themed APIMATIC-BUILD.json — cosmos base, custom primary and
 * link colours, and Inter/Courier Prime pulled from Google Fonts — so these
 * snapshots cover the theming pipeline too.
 *
 * Baselines: dxv2-portal-snapshots/dxv2-visual/petstore/
 * Update them with `pnpm test:visual:update` after an intentional UI change,
 * and review the diff images before committing.
 */

const { routes } = portalConfig();

test.describe("Petstore portal — visual @petstore", () => {
  test("Getting Started (generated Quickstart) — light", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);

    // The build pins colorMode.defaultMode to "light", so this is also checking
    // that the build file's theme settings actually reached the browser.
    expect(await docs.colorMode()).toBe("light");
    await expect(page).toHaveScreenshot("quickstart-light.png", snapshotOptions(page));
  });

  test("Getting Started (generated Quickstart) — dark", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);
    await docs.toggleColorMode();

    // disableSwitch is false in the build file, so the toggle must be present
    // and must actually flip the mode.
    expect(await docs.colorMode()).toBe("dark");
    await expect(page).toHaveScreenshot("quickstart-dark.png", snapshotOptions(page));
  });

  test("Authored markdown page renders", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.whyApimatic);

    await expect(docs.pageHeading).toHaveText("What APIMatic Offers");
    await expect(page).toHaveScreenshot("why-apimatic-light.png", snapshotOptions(page));
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

  test("Model page — object with a property table", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);

    // Pet has $ref'd properties (Category, PetTags, PetStatus) and a JSON
    // example — a table that silently lost a row would still screenshot stably.
    await expect(docs.pageContent.getByRole("table")).toBeVisible();
    await expect(page).toHaveScreenshot("model-pet-light.png", snapshotOptions(page));
  });

  test("Model page — enum with allowed values", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelEnum);

    // Enums render as a list rather than a table, so this is a different
    // code path from the model page above.
    await expect(docs.pageHeading).toHaveText("PetStatus");
    await expect(page).toHaveScreenshot("model-petstatus-light.png", snapshotOptions(page));
  });

  test("Model page — dark", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);
    await docs.toggleColorMode();

    await expect(page).toHaveScreenshot("model-pet-dark.png", snapshotOptions(page));
  });

  test("Portal chrome — header", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);

    // Element-scoped: catches a broken logo or search control without failing
    // every time page content changes. This build renders no section tabs, so
    // the header is all the top chrome there is.
    await expect(docs.header).toHaveScreenshot("portal-header.png", {
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    });
  });

  test("Sidebar navigation tree — Models", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);

    expect(await docs.isSidebarDisplayed()).toBe(true);
    await expect(docs.sidebar).toHaveScreenshot("sidebar-models.png", {
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    });
  });

  test("Sidebar collapsed", async ({ page }) => {
    const docs = new DocsPage(page);
    // Quickstart's section holds a single entry and its sidebar stays hidden,
    // so take this on a Models page, where the tree is real.
    await docs.open(routes.modelObject);
    await docs.collapseSidebar();

    await expect(page).toHaveScreenshot("model-pet-sidebar-collapsed.png", snapshotOptions(page));
  });

  test("Table of contents", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);

    // Element-scoped: the ToC is built from the page's headings, so it breaks
    // independently of how the article body renders.
    await expect(docs.toc).toBeVisible();
    await expect(docs.toc).toHaveScreenshot("toc-model-pet.png", {
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    });
  });

  test("Endpoint code sample — Python selected", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.endpoint);
    await docs.selectCodeLanguage("Python");

    // The build ships 7 language tabs; this covers the non-default render path
    // and proves the selection survives into the pixels.
    expect(await docs.selectedCodeLanguage()).toBe("Python");
    await expect(page).toHaveScreenshot("endpoint-code-python.png", snapshotOptions(page));
  });

  test("Search overlay with results", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);
    await docs.searchFor("Pet");

    // An empty overlay is already covered below — this is the populated state,
    // including the result rows and the Ask AI row beneath them.
    expect(await docs.searchResultsMatching("Pet").count()).toBeGreaterThan(1);
    await expect(page).toHaveScreenshot("search-results.png", snapshotOptions(page));
  });

  test("Mobile viewport", async ({ page }) => {
    const docs = new DocsPage(page);
    // The header swaps to its icon-only variants below `md` and the sidebar
    // collapses behind a trigger — a different layout, not just a narrower one.
    await page.setViewportSize({ width: 390, height: 844 });
    await docs.open(routes.modelObject);

    await expect(page).toHaveScreenshot("model-pet-mobile.png", snapshotOptions(page));
  });

  test("Search overlay", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);
    await docs.openSearch();

    await expect(docs.searchDialog).toBeVisible();
    await expect(page).toHaveScreenshot("search-overlay-light.png", snapshotOptions(page));
  });
});
