import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { ApiReferencePage } from "../../../pages/ApiReferencePage.ts";
import { DocsPage } from "../../../pages/DocsPage.ts";
import { getPortal } from "../../../config/portals.ts";
import {
  apimaticConfigPath,
  portalConfig,
  portalName,
} from "../../../utils/env.ts";
import {
  normalizeText,
  type ApimaticConfig,
  type GeneratedPortal,
} from "../../../utils/artifacts.ts";
import { generateScenario } from "../../../utils/scenario.ts";
import {
  scenarioBaseURL,
  serveDir,
  type ServedPortal,
} from "../../../utils/serve.ts";

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
async function answerCalls(
  page: Page,
  url: string,
  body: string,
): Promise<void> {
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
    const serverTemplate =
      "https://{tenant}.petstore.{region}.example.com/api/v3";
    const resolvedServer = "https://demo.petstore.us-east.example.com/api/v3";

    test("selecting the second server updates the cURL sample and the request URL", async ({
      page,
    }) => {
      await answerCalls(
        page,
        `${resolvedServer}/**`,
        '{"id":10,"name":"doggie"}',
      );

      const api = new ApiReferencePage(page);
      await api.open(routes.apiEndpoint);
      await api.openPlayground();
      // Starts on the first server.
      await expect(api.serverUrlButton).toHaveAccessibleName(defaultServer);

      await api.selectServer(serverTemplate);

      // The playground and the code sample both resolve the variables' defaults.
      await expect(api.serverUrlButton).toHaveAccessibleName(resolvedServer);
      await expect(api.codeSample("cURL")).toContainText(
        `curl -X POST '${resolvedServer}/pet'`,
      );

      const response = await api.sendRequest();

      // What went over the wire: the operation's path on the selected server.
      expect(response.request().method()).toBe("POST");
      expect(response.url()).toBe(`${resolvedServer}/pet`);
      await expect(api.responseStatus).toHaveText("200 OK");
    });

    test("editing the free-text variable and changing the enum updates the server URL and cURL sample", async ({
      page,
    }) => {
      const editedServer = "https://acme.petstore.eu-west.example.com/api/v3";

      const api = new ApiReferencePage(page);
      await api.open(routes.apiEndpoint);
      await api.openPlayground();
      await api.selectServer(serverTemplate);
      await expect(api.serverUrlButton).toHaveAccessibleName(resolvedServer);

      // Change both variables away from their defaults ("demo", "us-east").
      await api.fillServerVariable("tenant", "acme");
      await api.chooseServerVariable("region", "eu-west");
      await expect(api.serverVariableInput("tenant")).toHaveValue("acme");
      await expect(api.serverVariableSelect("region")).toHaveText("eu-west");

      // The portal applies variable edits to the server URL 300ms after the
      // last one, and drops a pending edit if the popover closes first. So wait
      // for the URL to change before closing — it updates live while the
      // popover is open. Closing straight away made this test flaky.
      await expect(api.serverUrlButton).toHaveAccessibleName(editedServer);
      await api.closeServerDialog();

      // Both edits survive the close, in the server URL and in the code sample.
      await expect(api.serverUrlButton).toHaveAccessibleName(editedServer);
      await expect(api.codeSample("cURL")).toContainText(
        `curl -X POST '${editedServer}/pet'`,
      );
    });
  });

  test.describe("parameters @parameters", () => {
    test("path, query and header parameters all reach the request", async ({
      page,
    }) => {
      await answerCalls(page, `${defaultServer}/pet/*/visits*`, "[]");

      const api = new ApiReferencePage(page);
      await api.open(routes.apiEndpointParams);
      await api.openPlayground();

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
      await expect(api.responseStatus).toHaveText("200 OK");
    });
  });
});

/**
 * portal.brand — logo. Petstore declares a light/dark logo pair, so this
 * scenario generates its own copy with one logo path and serves it on the
 * scenario port (utils/serve.ts). It doesn't depend on PORTAL: it always
 * copies petstore, and never touches the portal the rest of this file uses.
 */
test.describe("portal.brand — logo @brand", () => {
  test.describe("single logo path", () => {
    // Pages in here come from this scenario's own server.
    test.use({ baseURL: scenarioBaseURL() });

    let portal: GeneratedPortal;
    let server: ServedPortal | undefined;

    test.beforeAll(async () => {
      // A real CLI generation plus a server start; more than the 120s default.
      test.setTimeout(300_000);
      portal = await generateScenario(
        "single logo",
        {
          config: (config) => {
            // One path instead of the light/dark pair. The file is already in
            // the build's static/images/.
            config.portal!.brand!.logo = "static/images/logo.png";
          },
        },
        { build: "petstore" },
      );
      server = await serveDir(portal.outDir);
    });
    test.afterAll(async () => {
      await server?.stop();
      portal?.cleanup();
    });

    test("one logo is used in both colour modes", async ({ page }) => {
      // Read the declared path off the scenario's own apimatic.json.
      const declared = portal.config().portal?.brand?.logo;
      expect(typeof declared, "portal.brand.logo should be a single path").toBe(
        "string",
      );
      // static/ is the web root: static/images/logo.png is served as /images/logo.png.
      const expectedSrc = `/${(declared as string).replace(/^static\//, "")}`;

      const docs = new DocsPage(page);
      await docs.open(getPortal("petstore").routes.home);

      // The same single logo shows in each mode, and nothing else shows with it.
      await docs.setColorMode("light");
      expect(
        await docs.visibleLogoSources(),
        "logo shown in light mode",
      ).toEqual([expectedSrc]);

      await docs.setColorMode("dark");
      expect(
        await docs.visibleLogoSources(),
        "logo shown in dark mode",
      ).toEqual([expectedSrc]);
    });
  });
});

/**
 * portal.navigation — the links `portal.navigation.links` puts in the top bar,
 * on the petstore build as committed. It already declares both kinds of link,
 * so there's nothing to generate here.
 *
 * Which link each test uses is read off apimatic.json, never hardcoded: the
 * first entry whose url is absolute (external) or starts with "/" (internal).
 */

type NavLink = { label: string; url: string };

/** The navigation links the served build declares. */
function declaredNavLinks(): NavLink[] {
  const config: ApimaticConfig = JSON.parse(
    fs.readFileSync(apimaticConfigPath(), "utf-8"),
  );
  return config.portal?.navigation?.links ?? [];
}

test.describe("portal.navigation @navigation", () => {
  // The links and routes used here are the petstore build's.
  test.skip(portalName() !== "petstore", "Run with PORTAL=petstore");

  const { routes } = portalConfig();
  const links = declaredNavLinks();

  test("external link — opens in a new tab with rel noreferrer noopener", async ({
    page,
  }) => {
    const external = links.find((link) => /^https?:\/\//.test(link.url));
    test.skip(!external, "no external link in portal.navigation.links");
    const target = new URL(external!.url);

    // Answer the external site here, so no real request leaves the machine,
    // and note the Referer the new tab sent (noreferrer means there isn't one).
    let referer: string | undefined = "not requested";
    await page.context().route(`${target.origin}/**`, async (route) => {
      referer = (await route.request().allHeaders())["referer"];
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<title>stub</title>",
      });
    });

    const docs = new DocsPage(page);
    await docs.open(routes.home);
    const link = docs.navLink(external!.label);

    // What the portal wrote on the link.
    await expect(link).toHaveAttribute("href", external!.url);
    await expect(link).toHaveAttribute("target", "_blank");
    const rel = ((await link.getAttribute("rel")) ?? "").split(/\s+/);
    expect(rel, "rel on the link").toEqual(
      expect.arrayContaining(["noreferrer", "noopener"]),
    );

    // What it does: a new tab opens on the external URL, and the portal stays put.
    const portalUrl = page.url();
    const [newTab] = await Promise.all([
      page.waitForEvent("popup"),
      link.click(),
    ]);
    await newTab.waitForLoadState("domcontentloaded");
    expect(newTab.url(), "the new tab's address").toBe(target.href);
    expect(page.url(), "the portal tab's address").toBe(portalUrl);

    // What rel does: noopener leaves the new tab no handle back to the portal,
    // noreferrer keeps the portal's address out of the request.
    expect(
      await newTab.evaluate(() => window.opener),
      "window.opener in the new tab",
    ).toBeNull();
    expect(referer, "Referer header sent to the external site").toBeUndefined();
  });

  test("internal link — navigates to the portal page without a reload", async ({
    page,
  }) => {
    const internal = links.find((link) => link.url.startsWith("/"));
    test.skip(!internal, "no internal link in portal.navigation.links");

    const docs = new DocsPage(page);
    await docs.open(routes.home);

    // A full reload throws away the page's JavaScript state; client-side
    // navigation keeps it. Mark the page, and record any new HTML document
    // the browser fetches — a reload would fetch one.
    await page.evaluate(() => {
      (window as unknown as { noReloadMarker: boolean }).noReloadMarker = true;
    });
    const documentsLoaded: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "document")
        documentsLoaded.push(request.url());
    });

    await docs.navLink(internal!.label).click();

    // It went where the link says (the portal adds a trailing slash).
    await expect(page).toHaveURL(new RegExp(`${internal!.url}/?$`));
    await docs.waitUntilReady();

    // And it got there without reloading.
    const marker = await page.evaluate(
      () => (window as unknown as { noReloadMarker?: boolean }).noReloadMarker,
    );
    expect(marker, "the page's JavaScript state survived the navigation").toBe(
      true,
    );
    expect(
      documentsLoaded,
      "HTML documents fetched during the navigation",
    ).toEqual([]);
  });
});

/**
 * portal.ai — the `portal.ai` block of apimatic.json, on a page of the
 * petstore build. Petstore turns pageActions on, so this scenario generates
 * its own copy with the change and serves it on the scenario port
 * (utils/serve.ts). It doesn't depend on PORTAL: it always copies petstore.
 */
test.describe("portal.ai @ai", () => {
  test.describe("pageActions false", () => {
    // Pages come from this scenario's own server, and the test reads back
    // what Copy Markdown put on the clipboard.
    test.use({
      baseURL: scenarioBaseURL(),
      permissions: ["clipboard-read", "clipboard-write"],
    });

    let portal: GeneratedPortal;
    let server: ServedPortal | undefined;

    test.beforeAll(async () => {
      // A real CLI generation plus a server start; more than the 120s default.
      test.setTimeout(300_000);
      portal = await generateScenario(
        "page actions off",
        {
          config: (config) => {
            config.portal!.ai!.pageActions = false;
          },
        },
        { build: "petstore" },
      );
      server = await serveDir(portal.outDir);
    });
    test.afterAll(async () => {
      await server?.stop();
      portal?.cleanup();
    });

    test("the popover is gone and Copy Markdown still copies the page", async ({
      page,
    }) => {
      // Read the declared side off the scenario's own apimatic.json.
      expect(
        portal.config().portal?.ai?.pageActions,
        "portal.ai.pageActions in the scenario's apimatic.json",
      ).toBe(false);

      const route = getPortal("petstore").routes.guides;
      // Every page is also generated as a markdown file: /guides/ -> guides.md.
      const markdownFile = `${route.replace(/^\/|\/$/g, "")}.md`;

      const docs = new DocsPage(page);
      await docs.open(route);

      // Copy Markdown is still in the page actions bar...
      await expect(
        docs.copyMarkdownButton,
        "Copy Markdown button",
      ).toBeVisible();
      // ...but the "Open" menu beside it, which opens the popover, is not.
      await expect(
        docs.pageActionsMenuButton,
        "the button that opens the popover",
      ).toHaveCount(0);

      // And Copy Markdown still does its job: the page's markdown file lands on
      // the clipboard. Line endings normalised — Windows' clipboard adds \r.
      const copied = await docs.copyPageMarkdown();
      expect(
        normalizeText(copied),
        `clipboard vs the generated ${markdownFile}`,
      ).toBe(normalizeText(portal.read(markdownFile)));
    });
  });
});

/**
 * languages — publishing. A language whose publishing block has only `source`:
 * its SDK is on GitHub but not on a registry. Petstore publishes every
 * language, so this scenario generates its own copy and serves it on the
 * scenario port (utils/serve.ts). It doesn't depend on PORTAL.
 */
test.describe("languages — publishing @sdks", () => {
  test.describe("source only", () => {
    // The language this scenario strips down, and its page's named route.
    const language = "typescript";
    const languageRoute = getPortal("petstore").routes.sdkTypescript;

    // Pages in here come from this scenario's own server.
    test.use({ baseURL: scenarioBaseURL() });

    let portal: GeneratedPortal;
    let server: ServedPortal | undefined;

    test.beforeAll(async () => {
      // A real CLI generation plus a server start; more than the 120s default.
      test.setTimeout(300_000);
      portal = await generateScenario(
        `${language} source only`,
        {
          config: (config) => {
            // Keep `source`, drop `package` and `packageConfiguration`.
            const entry = config.languages![language] as {
              publishing: { source?: unknown };
            };
            config.languages![language] = {
              publishing: { source: entry.publishing.source },
            };
          },
        },
        { build: "petstore" },
      );
      server = await serveDir(portal.outDir);
    });
    test.afterAll(async () => {
      await server?.stop();
      portal?.cleanup();
    });

    test("the card shows Download and View source", async ({ page }) => {
      // Read the declared side off the scenario's own apimatic.json.
      const declared = portal
        .declaredLanguages()
        .find((l) => l.name === language);
      expect(
        declared?.repositoryUrl,
        `${language} publishing.source.repositoryUrl`,
      ).toBeTruthy();
      expect(
        declared?.version,
        `${language} publishing.package should be gone`,
      ).toBeUndefined();
      // Each language's SDK archive is served from __downloads/sdk/<language>.zip.
      const downloadHref = `/__downloads/sdk/${language}.zip`;

      const docs = new DocsPage(page);

      // The language's card on the SDKs overview: "Download SDK" and "Source".
      await docs.open(getPortal("petstore").routes.sdks);
      const card = docs.sdkCard(language);
      await expect(card, `${language} card on the SDKs overview`).toBeVisible();
      await expect(
        docs.downloadSdkLink(card),
        "Download SDK on the card",
      ).toBeVisible();
      await expect(docs.downloadSdkLink(card)).toHaveAttribute(
        "href",
        downloadHref,
      );
      await expect(
        docs.sdkSourceLink(card),
        "Source on the card",
      ).toBeVisible();
      await expect(docs.sdkSourceLink(card)).toHaveAttribute(
        "href",
        declared!.repositoryUrl!,
      );

      // The language's own page: "Download SDK" and "View source".
      await docs.open(languageRoute);
      await expect(
        docs.downloadSdkLink(),
        "Download SDK on the SDK page",
      ).toBeVisible();
      await expect(docs.downloadSdkLink()).toHaveAttribute(
        "href",
        downloadHref,
      );
      await expect(
        docs.sdkSourceLink(),
        "View source on the SDK page",
      ).toBeVisible();
      await expect(docs.sdkSourceLink()).toHaveAttribute(
        "href",
        declared!.repositoryUrl!,
      );
    });
  });
});
