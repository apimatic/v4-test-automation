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
 * `apps/docs/generated/docs/**` (.mdx + meta.json), and the portal serves it.
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
  petstore: {
    buildDir: "test-builds/petstore",
    label: "My First Portal",
    routes: {
      // Landing page from the `generate: Quickstart / from: getting-started`
      // directive in the build's content/toc.yml.
      quickstart: "/docs/getting-started/quickstart",

      // Hand-authored markdown from content/why-apimatic/.
      whyApimatic: "/docs/why-apimatic/what-apimatic-offers",

      // `generate:` directives at the ROOT of toc.yml are loose nodes, so the
      // portal sweeps them into a trailing "More" section — hence /more/ here
      // rather than a top-level slug. Nest them in a `group:` to change that.
      //
      // The spec declares pet/store/user tags but defines a single operation,
      // so API Endpoints is this one page. That's the spec, not a generation bug.
      endpoint: "/docs/more/api-endpoints/user/deleteuser",

      // Models is the richest part of this build — 16 pages. `pet` is an object
      // with $refs and an example; `petstatus` is an enum, which renders as an
      // allowed-values list rather than a property table.
      modelObject: "/docs/more/models/pet",
      modelEnum: "/docs/more/models/petstatus",

      // No `events` route on purpose. The build asks for `from: callbacks` and
      // `from: webhooks`, which this portal version doesn't implement (generation
      // warns "unknown generate directive"), so the section is generated with no
      // pages: /docs/events 404s and it appears nowhere in the navigation. If
      // those directives ever start working, add the route here and the
      // registry check in tests/functional will start covering it.
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
