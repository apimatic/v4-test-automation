import { test, expect } from "@playwright/test";
import { ApiReferencePage } from "../../../pages/ApiReferencePage.ts";
import { portalConfig, portalName } from "../../../utils/env.ts";
import { snapshotOptions } from "../../../utils/visual.ts";

/**
 * Stage 3: the API reference's auth handling, one operation per auth type.
 *
 * Needs two servers:
 *   PORTAL=auth pnpm portal:serve      the portal, on 8080
 *   node api-tester/bin/www            the API it calls, on 3000
 *
 * test-builds/auth/README.md maps each operation to its route and credentials.
 */

test.describe("Auth — API reference playground @auth", () => {
  // These routes only exist in the auth build.
  test.skip(portalName() !== "auth", "Run with PORTAL=auth");

  const { routes } = portalConfig();

  test("no auth — a call with no credentials passes", async ({ page }) => {
    const api = new ApiReferencePage(page);
    await api.open(routes.authNone);

    const response = await api.sendRequest();

    // What went over the wire: no credentials, and the API Tester accepted it.
    expect(response.request().headers()["authorization"]).toBeUndefined();
    expect(response.status()).toBe(200);

    // What the playground shows for it.
    await expect(api.responseStatus).toHaveText("200 Successful");
    await expect(api.responseBody).toHaveText("You've passed the test!");
    await expect(api.playground).toHaveScreenshot("no-auth-response.png", snapshotOptions(page));
  });
});
