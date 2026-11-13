import { test, expect } from "@playwright/test";
import { ApiReferencePage } from "../../../pages/ApiReferencePage.ts";
import { portalConfig, portalName } from "../../../utils/env.ts";

/**
 * Server selection on the playground. The petstore spec's second server
 * (test-builds/petstore/src/spec/petstore.json) has a free-text `tenant` and an
 * enum `region`, defaulting to "demo" and "us-east".
 *
 * Its host doesn't exist, so the call is intercepted and answered here — what's
 * under test is where the portal sends it, not what comes back.
 */
test.describe("Servers — API reference playground @servers", () => {
  // The route and the second server only exist in the petstore build.
  test.skip(portalName() !== "petstore", "Run with PORTAL=petstore");

  const { routes } = portalConfig();
  const serverTemplate = "https://{tenant}.petstore.{region}.example.com/api/v3";
  const resolvedServer = "https://demo.petstore.us-east.example.com/api/v3";

  test("selecting the second server updates the cURL sample and the request URL", async ({
    page,
  }) => {
    // Answer the call, including the CORS preflight a cross-origin JSON POST triggers.
    await page.route(`${resolvedServer}/**`, (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "*",
        },
        contentType: "application/json",
        body: route.request().method() === "OPTIONS" ? "" : '{"id":10,"name":"doggie"}',
      }),
    );

    const api = new ApiReferencePage(page);
    await api.open(routes.apiEndpoint);
    // Starts on the first server.
    await expect(api.serverUrlButton).toHaveAccessibleName(
      "Server URL https://petstore3.swagger.io/api/v3",
    );

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
