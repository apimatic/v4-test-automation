import { test, expect } from "@playwright/test";
import { portalConfig } from "../../../utils/env.ts";

/**
 * The portal's machine-facing surface: the llms.* routes an AI agent reads, the
 * search API behind the overlay, and the static-asset route serving the build's
 * images.
 *
 * No browser needed — these are HTTP contracts. They're also the parts most
 * likely to rot unnoticed, because nothing on screen changes when they break.
 */

const { routes } = portalConfig();

test.describe("Petstore portal — content endpoints @petstore", () => {
  test("llms.txt lists the portal's pages", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toContain("My First Portal");
    // Generated model pages should be discoverable from the index.
    expect(body).toContain("/docs/more/models/pet");
  });

  test("llms-full.txt carries the actual page content", async ({ request }) => {
    const res = await request.get("/llms-full.txt");
    expect(res.status()).toBe(200);

    const body = await res.text();
    // Substantially larger than the index, and containing real content rather
    // than just links — that's the distinction between the two routes.
    expect(body.length).toBeGreaterThan(5000);
    expect(body).toContain("PetStatus");
  });

  test("llms.mdx serves a single page as markdown", async ({ request }) => {
    const res = await request.get("/llms.mdx/more/models/pet");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toContain("Pet");
    // The property table from the spec, in source form.
    expect(body).toContain("photoUrls");
  });

  test("the search API returns matches with breadcrumbs", async ({ request }) => {
    const res = await request.get("/api/search?query=PetStatus");
    expect(res.status()).toBe(200);

    const results = (await res.json()) as Array<{ url: string; breadcrumbs?: string[] }>;
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.url === "/docs/more/models/petstatus")).toBe(true);
    // Breadcrumbs are what make a result readable in the overlay.
    expect(results[0].breadcrumbs?.length ?? 0).toBeGreaterThan(0);
  });

  test("static assets from the build are served", async ({ request }) => {
    // Referenced as logoUrl in APIMATIC-BUILD.json and copied to generated/static.
    const res = await request.get("/static/images/placeholder-logo.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image");
  });

  test("every route in the registry responds", async ({ request }) => {
    // Cheap guard against a toc change silently moving a page: the visual specs
    // would fail with a confusing timeout, this says which route died.
    for (const [name, route] of Object.entries(routes)) {
      const res = await request.get(route);
      expect(res.status(), `${name} (${route}) should serve`).toBe(200);
    }
  });
});
