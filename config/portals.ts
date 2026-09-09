/**
 * Registry of the portal builds we run visual tests against.
 *
 * The builds live in THIS repo, under `test-builds/`, so the tests own their
 * fixtures: a failing snapshot means the portal changed, never that someone
 * edited a build file in the portal repo. They're copied from
 * `apps/docs/test-specs/customer-build/` in apimatic-dx-portal-v2 — see
 * test-builds/README.md for how to refresh one.
 *
 * `pnpm generate-docs -- --customer-build <dir>` turns a build into
 * `apps/docs/generated/docs/**` (.mdx + meta.json), and `pnpm run dev` serves it.
 * Routes below are the URLs those generated files end up at — every page is
 * served under `/docs/<slug>` (`/` just redirects to `/docs`).
 *
 * Adding a portal = copying the build into test-builds/, adding an entry here,
 * and adding a test file under tests/visual/<name>/.
 */

export type PortalRoutes = Record<string, string>;

export type PortalConfig = {
  /** Path to the build folder, relative to this repo's root. */
  buildDir: string;
  /** Human name, used in test titles. */
  label: string;
  /** Named routes so tests never hardcode slugs. */
  routes: PortalRoutes;
};

export const portals = {
  slack: {
    buildDir: "test-builds/slack",
    label: "Slack for Developers",
    routes: {
      // Landing page generated from the `generate: Quickstart / from: getting-started`
      // directive in the build's content/toc.yml.
      quickstart: "/docs/getting-started/quickstart",
      // Hand-authored markdown pages from content/guides/.
      guideQuickstart: "/docs/documentation/quickstart",
      guideCredentials: "/docs/documentation/get-api-credentials",
      // An operation page — renders the interactive playground via fumadocs-openapi.
      endpoint: "/docs/api-reference/endpoints/chat/chat-postmessage",
      // Directive-driven sections.
      sdks: "/docs/sdks/sdks-overview",
      mcp: "/docs/mcp/mcp-overview",
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
