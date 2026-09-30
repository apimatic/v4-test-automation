import { test, expect } from "@playwright/test";
import { DocsPage } from "../../../pages/DocsPage.ts";
import { portalConfig } from "../../../utils/env.ts";
import { snapshotOptions } from "../../../utils/visual.ts";

/**
 * Stage 3: how the served portal looks.
 *
 * One test on purpose — enough to prove the whole path works end to end
 * (generate with the CLI, serve the static output, compare against a committed
 * baseline) without committing to coverage before the structure settles.
 *
 * Baselines: portal-snapshots/visual/petstore/
 * Update with `pnpm test:visual:update` after an intentional change, and look
 * at the diff images before committing them.
 */

const { routes } = portalConfig();

test.describe("Petstore v4 portal — visual @petstore", () => {
  test("landing page", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.home);

    // Paired with a real assertion: a screenshot alone can pass on a page that
    // rendered the wrong thing but rendered it stably.
    expect(await docs.isPortalChromeDisplayed()).toBe(true);
    await expect(page).toHaveScreenshot("home.png", snapshotOptions(page));
  });
});
