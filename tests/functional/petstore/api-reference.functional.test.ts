import { test, expect, type Page } from "@playwright/test";
import { ApiReferencePage } from "../../../pages/ApiReferencePage.ts";
import { portalConfig, portalName } from "../../../utils/env.ts";

/**
 * Stage 3: the API reference playground on the petstore build — which server a
 * call goes to, and what parameters go with it.
 *
 * The spec (test-builds/petstore/src/spec/petstore.json) declares what's used here:
 *   - a second server with a free-text `tenant` and an enum `region`,
 *     defaulting to "demo" and "us-east"
 *   - listPetVisits, with one parameter of each kind: petId (path),
 *     limit (query), X-Clinic-Id (header)
 *
 * Every call is intercepted and answered here, so no real server is hit —
 * what's under test is the request the portal builds, not what comes back.
 */

/**
 * Answer every call matching `url` with a 200 and `body`, including the CORS
 * preflight the browser sends first for a JSON body or a custom header.
 */
async function answerCalls(page: Page, url: string, body: string): Promise<void> {
  await page.route(url, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
      },
      contentType: "application/json",
      body: route.request().method() === "OPTIONS" ? "" : body,
    }),
  );
}

test.describe("API reference playground @api-reference", () => {
  // The routes and the spec additions only exist in the petstore build.
  test.skip(portalName() !== "petstore", "Run with PORTAL=petstore");

  const { routes } = portalConfig();
  const defaultServer = "https://petstore3.swagger.io/api/v3";

  test.describe("servers @servers", () => {
    const serverTemplate = "https://{tenant}.petstore.{region}.example.com/api/v3";
    const resolvedServer = "https://demo.petstore.us-east.example.com/api/v3";

    test("selecting the second server updates the cURL sample and the request URL", async ({
      page,
    }) => {
      await answerCalls(page, `${resolvedServer}/**`, '{"id":10,"name":"doggie"}');

      const api = new ApiReferencePage(page);
      await api.open(routes.apiEndpoint);
      // Starts on the first server.
      await expect(api.serverUrlButton).toHaveAccessibleName(`Server URL ${defaultServer}`);

      await api.selectServer(serverTemplate);

      // The playground and the code sample both resolve the variables' defaults.
      await expect(api.serverUrlButton).toHaveAccessibleName(`Server URL ${resolvedServer}`);
      await expect(api.codeSample("cURL")).toContainText(`curl -X POST "${resolvedServer}/pet"`);

      const response = await api.sendRequest();

      // What went over the wire: the operation's path on the selected server.
      expect(response.request().method()).toBe("POST");
      expect(response.url()).toBe(`${resolvedServer}/pet`);
      await expect(api.responseStatus).toHaveText("200 Successful");
    });

    test("editing the free-text variable and changing the enum updates the server URL and cURL sample", async ({
      page,
    }) => {
      const editedServer = "https://acme.petstore.eu-west.example.com/api/v3";

      const api = new ApiReferencePage(page);
      await api.open(routes.apiEndpoint);
      await api.selectServer(serverTemplate);
      await expect(api.serverUrlButton).toHaveAccessibleName(`Server URL ${resolvedServer}`);

      // Change both variables away from their defaults ("demo", "us-east").
      await api.fillServerVariable("tenant", "acme");
      await api.chooseServerVariable("region", "eu-west");
      await expect(api.serverVariableInput("tenant")).toHaveValue("acme");
      await expect(api.serverVariableSelect("region")).toHaveText("eu-west");
      await api.closeServerDialog();

      // Both edits land in the playground's server URL and in the code sample.
      await expect(api.serverUrlButton).toHaveAccessibleName(`Server URL ${editedServer}`);
      await expect(api.codeSample("cURL")).toContainText(`curl -X POST "${editedServer}/pet"`);
    });
  });

  test.describe("parameters @parameters", () => {
    test("path, query and header parameters all reach the request", async ({ page }) => {
      await answerCalls(page, `${defaultServer}/pet/*/visits*`, "[]");

      const api = new ApiReferencePage(page);
      await api.open(routes.apiEndpointParams);

      // Values that differ from the spec's examples (10, 5, "clinic-42"), so a
      // pass means the edits went out, not the pre-filled defaults.
      await api.fillParameter("Path", "petId", "7");
      await api.fillParameter("Query", "limit", "3");
      await api.fillParameter("Header", "X-Clinic-Id", "clinic-99");

      const response = await api.sendRequest();
      const request = response.request();
      const url = new URL(request.url());

      // What went over the wire: one parameter in each place.
      expect(request.method()).toBe("GET");
      expect(url.pathname).toBe("/api/v3/pet/7/visits");
      expect(url.searchParams.get("limit")).toBe("3");
      expect(request.headers()["x-clinic-id"]).toBe("clinic-99");
      await expect(api.responseStatus).toHaveText("200 Successful");
    });
  });
});
