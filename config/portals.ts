/**
 * Registry of the portal builds we test.
 *
 * A build is a folder under `test-builds/` holding a `src/` directory — API
 * specs, markdown content, static assets and `apimatic.json`. The CLI turns it
 * into a static portal:
 *
 *   apimatic portal generate --input test-builds/<name>     -> test-builds/<name>/portal
 *   http-server -c-1 --cors                                 (inside portal/)
 *
 * The fixtures are vendored here on purpose, so a failing test means the
 * generator changed, never that someone edited a build out from under us.
 *
 * Adding a build = drop it in test-builds/, add an entry here, add spec folders
 * under tests/artifacts/, tests/visual/ and tests/functional/.
 */

export type PortalRoutes = Record<string, string>;

export type PortalConfig = {
  /** Path to the build folder (the one containing `src/`), relative to the repo root. */
  buildDir: string;
  /** Human name, used in test titles. */
  label: string;
  /** Named routes so tests never hardcode slugs. */
  routes: PortalRoutes;
};

export const portals = {
  petstore: {
    buildDir: "test-builds/petstore",
    label: "Swagger Petstore - OpenAPI 3.0",
    routes: {
      // Landing page.
      home: "/",

      // Authored markdown. `content/nav.json` lists these folders, and the CLI
      // makes a tab of each one.
      guides: "/guides/",
      guideAuthentication: "/guides/authentication/",
      // The build nests deeply on purpose — guides/webhooks/delivery/retries/
      // backoff/jitter/tuning — which is what exercises the sidebar tree.
      guideWebhooks: "/guides/webhooks/",

      // The MDX component showcase: accordions, callouts, tabs, mermaid, etc.
      components: "/components/",
      componentAccordions: "/components/accordions/",
      componentTabs: "/components/tabs/",
      // No mermaid route: /components/mermaid/ serves 200 but crashes at runtime
      // ("Expected component `Mermaid` to be defined"), so the shell never
      // mounts. Left out deliberately rather than left failing — add it back
      // once the component is provided.

      // GitHub Flavored Markdown rendering.
      gfm: "/gfm/",
      gfmTables: "/gfm/tables/",

      // Generated from the `languages` block of apimatic.json — one page per
      // declared language, plus a downloadable archive under /__downloads/sdk/.
      sdks: "/sdks/",
      sdkTypescript: "/sdks/typescript/",
      sdkPython: "/sdks/python/",
      sdkCsharp: "/sdks/csharp/",

      // Generated from the `plugin` block.
      contextPlugin: "/context-plugin/",

      // Generated from src/spec/petstore.json — 19 operations across pet,
      // store and user. No index route: /api/petstore/ is a 404 since the
      // reference stopped generating a landing page, and the "API Reference"
      // tab links straight to the first operation instead.
      apiEndpoint: "/api/petstore/pet/addPet/",
      apiEndpointDelete: "/api/petstore/pet/deletePet/",

      // Machine-facing routes an AI agent reads.
      llms: "/llms.txt",
      llmsFull: "/llms-full.txt",
    },
  },

  // One operation per auth type, served by APIMatic's API Tester on
  // localhost:3000 — start it before running anything that calls the API.
  // test-builds/auth/README.md maps each operation to its route and credentials.
  auth: {
    buildDir: "test-builds/auth",
    label: "Auth Tester",
    routes: {
      home: "/",
      // No apiReference index — /api/auth/ is a 404, as for petstore.

      // One scheme, or one AND-pair the server needs together.
      authNone: "/api/auth/single/noAuth/",
      authBasic: "/api/auth/single/basic/",
      authBearer: "/api/auth/single/bearer/",
      authApiKeyHeader: "/api/auth/single/apiKeyHeader/",
      authApiKeyQuery: "/api/auth/single/apiKeyQuery/",
      authApiKeyHeaderPair: "/api/auth/single/apiKeyHeaderPair/",

      // AND / OR combinations.
      authOr: "/api/auth/combination/orAuth/",
      authAnd: "/api/auth/combination/andAuth/",
      authOrOfAnds: "/api/auth/combination/orOfAnds/",

      // OAuth 2 flows — tokens are issued by the API Tester.
      authOAuthClientCredentials: "/api/auth/oauth-2/clientCredentials/",
      authOAuthAuthorizationCode: "/api/auth/oauth-2/authorizationCode/",
      authOAuthPassword: "/api/auth/oauth-2/password/",
      authOAuthOrBearer: "/api/auth/oauth-2/oauthOrBearer/",

      // No checker in the API Tester — these hit its echo catch-all, so they
      // show rendering and what was sent, not whether it was accepted.
      authApiKeyCookie: "/api/auth/unvalidated/apiKeyCookie/",
      authOAuthImplicit: "/api/auth/unvalidated/implicit/",
      authOpenIdConnect: "/api/auth/unvalidated/openIdConnect/",
      authDigest: "/api/auth/unvalidated/digest/",
    },
  },

  // APIMatic's own Portal Artifacts API. The playground calls the real
  // https://api.apimatic.io, so anything that sends a request needs
  // APIMATIC_AUTH_KEY set.
  apimatic: {
    buildDir: "test-builds/apimatic",
    label: "APIMatic Docs",
    routes: {
      home: "/",

      // The three calls of the generation flow, in the order they're made:
      // upload a build, poll its status, download what it produced. The
      // generator nests them under an extra `portal-artifacts/` segment.
      apiGenerateArtifacts:
        "/api/openapi/portal-artifacts/portal-artifacts-generation/Generate-Portal-Artifacts-Async/",
      apiArtifactsStatus:
        "/api/openapi/portal-artifacts/portal-artifacts-generation/Get-Portal-Artifacts-Generation-Status/",
      apiArtifactsDownload:
        "/api/openapi/portal-artifacts/portal-artifacts-generation/Download-Generated-Portal-Artifacts/",
    },
  },
} satisfies Record<string, PortalConfig>;

export type PortalName = keyof typeof portals;

export function getPortal(name: string): PortalConfig {
  const portal = portals[name as PortalName];
  if (!portal) {
    throw new Error(
      `Unknown portal "${name}". Known portals: ${Object.keys(portals).join(", ")}. ` +
        `Add it to config/portals.ts.`,
    );
  }
  return portal;
}
