import { test, expect, type Page } from "@playwright/test";
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

/**
 * The API Tester's hardcoded credentials (api-tester/utils/authentications.js,
 * listed in test-builds/auth/README.md). These are what the server checks
 * against, so they're the fixture here, not something the portal declares.
 */
const creds = {
  basic: { username: "Zeeshan", password: "bhai_99" },
  bearer: "0b79bab50daca910b000d4f1a2b675d604257e42",
  accessToken: "azHmdOe09EdchxeWsdnplkQbv76sJH",
  queryToken: "asdqwaxr2gSdhasWSDbdAgdA637sdAhde7Adysi23",
  headerToken: "Qaws2W233WedeRe4T56G6Vref2",
  apiKey: "api-key",
  clientCredentials: {
    clientId: "23",
    clientSecret: "tQNSqQlXBIwZcY9auoujQ57ckDcoh3t8UPbBRkSF",
  },
  authorizationCode: {
    clientId: "24",
    clientSecret: "Y9auoujQ57ckDtQNSqQlXBIwZccoh3t8UPbBRkSF",
  },
  password: {
    clientId: "25",
    clientSecret: "ckDcoh3t8UPbBRkSFtQNSqQlXBIwZcY9auoujQ57",
    username: "apimatic",
    password: "api-d604257e42-matic",
  },
};

/** What a Basic Authorization header should be: base64 of "user:pass". */
function basicHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

/** Wait for the OAuth token request to the given API Tester path. */
function waitForTokenResponse(page: Page, path: string) {
  return page.waitForResponse(
    (r) =>
      r.request().method() === "POST" && new URL(r.url()).pathname === path,
  );
}

test.describe("Auth — API reference playground @auth", () => {
  // These routes only exist in the auth build.
  test.skip(portalName() !== "auth", "Run with PORTAL=auth");

  const { routes } = portalConfig();

  test("no auth — a call with no credentials passes", async ({ page }) => {
    const api = new ApiReferencePage(page);
    await api.open(routes.authNone);
    await api.openPlayground();

    const response = await api.sendRequest();

    // What went over the wire: no credentials, and the API Tester accepted it.
    expect(response.request().headers()["authorization"]).toBeUndefined();
    expect(response.status()).toBe(200);

    // What the playground shows for it.
    await expect(api.responseStatus).toHaveText("200 OK");
    await expect(api.responseBody).toHaveText("You've passed the test!");
    await expect(api.playground).toHaveScreenshot(
      "no-auth-response.png",
      snapshotOptions(page),
    );
  });

  test("basic — valid credentials are sent as a Basic header and pass", async ({
    page,
  }) => {
    // The API Tester's hardcoded Basic credentials (test-builds/auth/README.md).
    const username = "Zeeshan";
    const password = "bhai_99";

    const api = new ApiReferencePage(page);
    await api.open(routes.authBasic);
    await api.openPlayground();
    await api.fillBasicAuth(username, password);

    const response = await api.sendRequest();

    // What went over the wire: base64 of "username:password", and the API Tester accepted it.
    const expectedHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
    expect(response.request().headers()["authorization"]).toBe(expectedHeader);
    expect(response.status()).toBe(200);

    // What the playground shows for it.
    await expect(api.responseStatus).toHaveText("200 OK");
    await expect(api.responseBody).toHaveText("You've passed the test!");
    await expect(api.playground).toHaveScreenshot(
      "basic-auth-response.png",
      snapshotOptions(page),
    );
  });

  test("bearer — the field is pre-filled with Bearer and the token passes", async ({
    page,
  }) => {
    const api = new ApiReferencePage(page);
    await api.open(routes.authBearer);
    await api.openPlayground();

    // The field opens holding the scheme's prefix.
    await expect(api.authorizationHeaderInput).toHaveValue("Bearer ");
    await api.fillAuthorizationHeader(`Bearer ${creds.bearer}`);

    const response = await api.sendRequest();

    expect(response.request().headers()["authorization"]).toBe(
      `Bearer ${creds.bearer}`,
    );
    expect(response.status()).toBe(200);

    await expect(api.responseStatus).toHaveText("200 OK");
    await expect(api.responseBody).toHaveText("You've passed the test!");
    await expect(api.playground).toHaveScreenshot(
      "bearer-response.png",
      snapshotOptions(page),
    );
  });

  test("API key in header — sent under the header name the spec declares", async ({
    page,
  }) => {
    const api = new ApiReferencePage(page);
    await api.open(routes.authApiKeyHeader);
    await api.openPlayground();
    await api.fillAuthField("accesstoken", "header", creds.accessToken);

    const response = await api.sendRequest();

    expect(response.request().headers()["accesstoken"]).toBe(creds.accessToken);
    expect(response.status()).toBe(200);

    await expect(api.responseStatus).toHaveText("200 OK");
    await expect(api.responseBody).toHaveText("You've passed the test!");
    await expect(api.playground).toHaveScreenshot(
      "api-key-header-response.png",
      snapshotOptions(page),
    );
  });

  test("API key in query — both keys of the AND-pair go on the URL", async ({
    page,
  }) => {
    const api = new ApiReferencePage(page);
    await api.open(routes.authApiKeyQuery);
    await api.openPlayground();
    await api.fillAuthField("token", "query", creds.queryToken);
    await api.fillAuthField("api-key", "query", creds.apiKey);

    const response = await api.sendRequest();

    const query = new URL(response.url()).searchParams;
    expect(query.get("token")).toBe(creds.queryToken);
    expect(query.get("api-key")).toBe(creds.apiKey);
    expect(response.status()).toBe(200);

    await expect(api.responseStatus).toHaveText("200 OK");
    await expect(api.responseBody).toHaveText("You've passed the test!");
    await expect(api.playground).toHaveScreenshot(
      "api-key-query-response.png",
      snapshotOptions(page),
    );
  });

  test("API key pair in headers — both keys of the AND-pair are sent", async ({
    page,
  }) => {
    const api = new ApiReferencePage(page);
    await api.open(routes.authApiKeyHeaderPair);
    await api.openPlayground();
    await api.fillAuthField("token", "header", creds.headerToken);
    await api.fillAuthField("api-key", "header", creds.apiKey);

    const response = await api.sendRequest();

    const headers = response.request().headers();
    expect(headers["token"]).toBe(creds.headerToken);
    expect(headers["api-key"]).toBe(creds.apiKey);
    expect(response.status()).toBe(200);

    await expect(api.responseStatus).toHaveText("200 OK");
    await expect(api.responseBody).toHaveText("You've passed the test!");
    await expect(api.playground).toHaveScreenshot(
      "api-key-header-pair-response.png",
      snapshotOptions(page),
    );
  });

  test.describe("combinations", () => {
    test("OR — choosing the second alternative sends only its keys", async ({
      page,
    }) => {
      const api = new ApiReferencePage(page);
      await api.open(routes.authOr);
      await api.openPlayground();
      // The query pair is selected by default; switch to the header pair.
      await api.selectAuthScheme(["headerToken", "headerApiKey"]);
      await api.fillAuthField("token", "header", creds.headerToken);
      await api.fillAuthField("api-key", "header", creds.apiKey);

      const response = await api.sendRequest();

      const headers = response.request().headers();
      expect(headers["token"]).toBe(creds.headerToken);
      expect(headers["api-key"]).toBe(creds.apiKey);
      // Nothing from the alternative that wasn't chosen.
      expect(new URL(response.url()).search).toBe("");
      expect(response.status()).toBe(200);

      await expect(api.responseStatus).toHaveText("200 OK");
      await expect(api.responseBody).toHaveText("You've passed the test!");
      await expect(api.playground).toHaveScreenshot(
        "or-auth-response.png",
        snapshotOptions(page),
      );
    });

    test("AND — Basic, the query pair and the header pair are all sent", async ({
      page,
    }) => {
      const api = new ApiReferencePage(page);
      await api.open(routes.authAnd);
      await api.openPlayground();
      await api.fillBasicAuth(creds.basic.username, creds.basic.password);
      await api.fillAuthField("token", "query", creds.queryToken);
      await api.fillAuthField("api-key", "query", creds.apiKey);
      await api.fillAuthField("token", "header", creds.headerToken);
      await api.fillAuthField("api-key", "header", creds.apiKey);

      const response = await api.sendRequest();

      const headers = response.request().headers();
      const query = new URL(response.url()).searchParams;
      expect(headers["authorization"]).toBe(
        basicHeader(creds.basic.username, creds.basic.password),
      );
      expect(query.get("token")).toBe(creds.queryToken);
      expect(query.get("api-key")).toBe(creds.apiKey);
      expect(headers["token"]).toBe(creds.headerToken);
      expect(headers["api-key"]).toBe(creds.apiKey);
      expect(response.status()).toBe(200);

      await expect(api.responseStatus).toHaveText("200 OK");
      await expect(api.responseBody).toHaveText("You've passed the test!");
      await expect(api.playground).toHaveScreenshot(
        "and-auth-response.png",
        snapshotOptions(page),
      );
    });

    test("OR of ANDs — switching to the bearer alternative passes", async ({
      page,
    }) => {
      const api = new ApiReferencePage(page);
      await api.open(routes.authOrOfAnds);
      await api.openPlayground();
      // The custom header is selected by default; switch to bearer.
      await api.selectAuthScheme(["bearerAuth"]);
      await api.fillAuthorizationHeader(`Bearer ${creds.bearer}`);

      const response = await api.sendRequest();

      const headers = response.request().headers();
      expect(headers["authorization"]).toBe(`Bearer ${creds.bearer}`);
      expect(headers["accesstoken"]).toBeUndefined();
      expect(response.status()).toBe(200);

      await expect(api.responseStatus).toHaveText("200 OK");
      await expect(api.responseBody).toHaveText("You've passed the test!");
      await expect(api.playground).toHaveScreenshot(
        "or-of-ands-response.png",
        snapshotOptions(page),
      );
    });
  });

  // No screenshots here: every run issues a new random token, and the playground
  // shows it.
  test.describe("OAuth 2", () => {
    test("client credentials — Authorize fetches a token and the call uses it", async ({
      page,
    }) => {
      const { clientId, clientSecret } = creds.clientCredentials;
      const api = new ApiReferencePage(page);
      await api.open(routes.authOAuthClientCredentials);
      await api.openPlayground();

      const tokenResponse = waitForTokenResponse(
        page,
        "/oauth2/auth-server/request_token",
      );
      await api.authorizeWithOAuth({ clientId, clientSecret });
      const token = await tokenResponse;

      // The token request: client credentials as a Basic header (the dialog's
      // default, and the only way the API Tester accepts them) and the right grant.
      expect(token.request().headers()["authorization"]).toBe(
        basicHeader(clientId, clientSecret),
      );
      expect(token.request().postData()).toContain(
        "grant_type=client_credentials",
      );
      expect(token.status()).toBe(200);
      const { access_token } = await token.json();

      // The issued token lands in the field and goes out on the call.
      await expect(api.authorizationHeaderInput).toHaveValue(`Bearer ${access_token}`);
      const response = await api.sendRequest();
      expect(response.request().headers()["authorization"]).toBe(
        `Bearer ${access_token}`,
      );
      expect(response.status()).toBe(200);

      await expect(api.responseStatus).toHaveText("200 OK");
      await expect(api.responseBody).toHaveText("You've passed the test!");
    });

    test("password — Authorize sends the user's credentials and the call uses the token", async ({
      page,
    }) => {
      const { clientId, clientSecret, username, password } = creds.password;
      const api = new ApiReferencePage(page);
      await api.open(routes.authOAuthPassword);
      await api.openPlayground();

      const tokenResponse = waitForTokenResponse(
        page,
        "/oauth2/non-auth-server/token",
      );
      await api.authorizeWithOAuth({
        clientId,
        clientSecret,
        username,
        password,
      });
      const token = await tokenResponse;

      expect(token.request().headers()["authorization"]).toBe(
        basicHeader(clientId, clientSecret),
      );
      const form = new URLSearchParams(token.request().postData() ?? "");
      expect(form.get("grant_type")).toBe("password");
      expect(form.get("username")).toBe(username);
      expect(form.get("password")).toBe(password);
      expect(token.status()).toBe(200);
      const { access_token } = await token.json();

      await expect(api.authorizationHeaderInput).toHaveValue(`Bearer ${access_token}`);
      const response = await api.sendRequest();
      expect(response.request().headers()["authorization"]).toBe(
        `Bearer ${access_token}`,
      );
      expect(response.status()).toBe(200);

      await expect(api.responseStatus).toHaveText("200 OK");
      // The playground pretty-prints JSON.
      await expect(api.responseBody).toHaveText(/"status":\s*"passed"/);
    });

    test("authorization code — the code from the redirect is exchanged and used", async ({
      page,
    }) => {
      // The API Tester's authorize endpoint drops `state` from its redirect,
      // and the portal (rightly) won't exchange a code without it. Pass the
      // real redirect through with `state` put back — standing in for a
      // compliant authorization server, so the portal's side is what's tested.
      await page.route(
        "**/oauth2/auth-server/oauth/authorize?**",
        async (route) => {
          const state = new URL(route.request().url()).searchParams.get(
            "state",
          );
          const upstream = await route.fetch({ maxRedirects: 0 });
          const location = new URL(upstream.headers()["location"]);
          location.searchParams.set("state", state ?? "");
          await route.fulfill({
            status: 302,
            headers: { location: location.toString() },
          });
        },
      );

      const { clientId, clientSecret } = creds.authorizationCode;
      const api = new ApiReferencePage(page);
      await api.open(routes.authOAuthAuthorizationCode);
      await api.openPlayground();

      const tokenResponse = waitForTokenResponse(
        page,
        "/oauth2/non-auth-server/token",
      );
      // Submit leaves the page for the authorize URL; the portal comes back to
      // this operation and exchanges the code on load.
      await api.authorizeWithOAuth({ clientId, clientSecret });
      const token = await tokenResponse;

      expect(token.request().headers()["authorization"]).toBe(
        basicHeader(clientId, clientSecret),
      );
      const form = new URLSearchParams(token.request().postData() ?? "");
      expect(form.get("grant_type")).toBe("authorization_code");
      // The code the API Tester always issues.
      expect(form.get("code")).toBe("910b000d4f");
      expect(token.status()).toBe(200);
      const { access_token } = await token.json();

      await expect(api.authorizationHeaderInput).toHaveValue(`Bearer ${access_token}`);
      const response = await api.sendRequest();
      expect(response.request().headers()["authorization"]).toBe(
        `Bearer ${access_token}`,
      );
      expect(response.status()).toBe(200);

      await expect(api.responseStatus).toHaveText("200 OK");
      // The playground pretty-prints JSON.
      await expect(api.responseBody).toHaveText(/"status":\s*"passed"/);
    });

    test("OAuth OR bearer — switching to the bearer alternative passes", async ({
      page,
    }) => {
      const api = new ApiReferencePage(page);
      await api.open(routes.authOAuthOrBearer);
      await api.openPlayground();
      await api.selectAuthScheme(["bearerAuth"]);
      await api.fillAuthorizationHeader(`Bearer ${creds.bearer}`);

      const response = await api.sendRequest();

      expect(response.request().headers()["authorization"]).toBe(
        `Bearer ${creds.bearer}`,
      );
      expect(response.status()).toBe(200);

      await expect(api.responseStatus).toHaveText("200 OK");
      await expect(api.responseBody).toHaveText("You've passed the test!");
    });
  });

  // The API Tester has no checker for these schemes, so each route echoes the
  // request back. The test is what arrived, not whether it was accepted. No
  // screenshots: the echo includes the browser's user-agent.
  test.describe("unvalidated (echo)", () => {
    test("OAuth implicit — a pasted token is sent as a Bearer header", async ({
      page,
    }) => {
      // The implicit flow can't complete — its authorize URL is the echo
      // catch-all — so this covers sending a token, not obtaining one.
      const api = new ApiReferencePage(page);
      await api.open(routes.authOAuthImplicit);
      await api.openPlayground();
      await api.fillAuthorizationHeader("Bearer implicit-token");

      const response = await api.sendRequest();
      const echoed = await response.json();

      expect(response.status()).toBe(200);
      expect(echoed.headers["authorization"]).toBe("Bearer implicit-token");
      await expect(api.responseStatus).toHaveText("200 OK");
    });

    test("OpenID Connect — the access token field sets the Authorization header", async ({
      page,
    }) => {
      const api = new ApiReferencePage(page);
      await api.open(routes.authOpenIdConnect);
      await api.openPlayground();

      await api.fillAuthorizationHeader("Bearer oidc-token");
      const response = await api.sendRequest();
      const echoed = await response.json();

      expect(response.status()).toBe(200);
      expect(echoed.headers["authorization"]).toBe("Bearer oidc-token");
      await expect(api.responseStatus).toHaveText("200 OK");
    });

    test("digest — the Authorization header value is sent as entered", async ({
      page,
    }) => {
      const digest = 'Digest username="Zeeshan", realm="test", nonce="abc"';
      const api = new ApiReferencePage(page);
      await api.open(routes.authDigest);
      await api.openPlayground();
      await api.fillAuthorizationHeader(digest);

      const response = await api.sendRequest();
      const echoed = await response.json();

      expect(response.status()).toBe(200);
      expect(echoed.headers["authorization"]).toBe(digest);
      await expect(api.responseStatus).toHaveText("200 OK");
    });
  });
});
