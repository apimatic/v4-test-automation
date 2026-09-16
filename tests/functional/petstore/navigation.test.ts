import { test, expect } from "@playwright/test";
import { DocsPage } from "../../../pages/DocsPage.ts";
import { portalConfig } from "../../../utils/env.ts";

/**
 * Navigation behaviour — the parts a screenshot can't judge.
 *
 * A visual test proves the sidebar and footer *look* right; these prove they
 * take you somewhere real. A link that renders perfectly and 404s is exactly
 * the regression pixels miss.
 */

const { routes } = portalConfig();

test.describe("Petstore portal — navigation @petstore", () => {
  test("footer Next goes to the following Models page", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);

    const href = await docs.footerNext.getAttribute("href");
    await docs.footerNext.click();
    await docs.waitUntilReady();

    expect(page.url()).toContain(href!);
    // Pet's neighbour in the generated order — asserting the destination, not
    // merely that navigation happened.
    await expect(docs.pageHeading).toHaveText("ApiResponse");
  });

  test("footer Previous goes back", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);

    await docs.footerPrevious.click();
    await docs.waitUntilReady();

    await expect(docs.pageHeading).toHaveText("Tag");
  });

  test("sidebar navigates between model pages", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);

    await docs.sidebar.getByRole("link", { name: "Order", exact: true }).click();
    await docs.waitUntilReady();

    await expect(docs.pageHeading).toHaveText("Order");
    expect(page.url()).toContain("/docs/more/models/order");
  });

  test("/docs redirects to the first page", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveURL(/\/docs\/getting-started\/quickstart$/);
  });

  test("the root redirects into the docs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/docs\//);
  });
});
