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
      // store and user.
      apiReference: "/api/petstore/",
      apiEndpoint: "/api/petstore/pet/addPet/",
      apiEndpointDelete: "/api/petstore/pet/deletePet/",

      // Machine-facing routes an AI agent reads.
      llms: "/llms.txt",
      llmsFull: "/llms-full.txt",
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
