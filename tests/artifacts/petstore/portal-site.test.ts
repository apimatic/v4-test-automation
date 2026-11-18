import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import type { GeneratedPortal } from "../../../utils/artifacts.ts";
import { generateScenario } from "../../../utils/scenario.ts";

/**
 * Stage 1: the `portal.site` block of apimatic.json against what the CLI
 * produced. One describe per row of the portal.site section in the QA sheet.
 *
 * The site name is written into every page's static HTML — the <title> suffix
 * ("<page> | <site name>") and <meta property="og:site_name">. Both are read
 * off index.html rather than the header, whose only hooks are Tailwind classes.
 */

test.describe("Petstore — portal.site @artifacts", () => {
  test.describe("name omitted, one spec", () => {
    let portal: GeneratedPortal;

    test.beforeAll(async () => {
      portal = await generateScenario(
        "site name omitted",
        {
          config: (config) => {
            delete (config.portal as { site?: { name?: string } } | undefined)?.site?.name;
          },
        },
        { build: "petstore" },
      );
    });
    test.afterAll(() => portal?.cleanup());

    test("the site name falls back to the spec title", () => {
      // Guard: the scenario must really have removed the name, or this test
      // would pass on the declared name rather than on the fallback.
      const site = (portal.config().portal as { site?: { name?: string } } | undefined)?.site;
      expect(site?.name, "portal.site.name in the scenario's apimatic.json").toBeUndefined();

      const expected = specTitle(portal);
      const html = portal.read("index.html");
      const ogSiteName = html.match(/<meta property="og:site_name" content="([^"]*)"/)?.[1];
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1];

      // Collected and asserted once, so a run reports both places.
      const problems: string[] = [];
      if (ogSiteName === undefined) problems.push("og:site_name meta tag is missing");
      else if (ogSiteName !== expected) problems.push(`og:site_name is "${ogSiteName}"`);
      if (title === undefined) problems.push("<title> is missing");
      else if (!title.endsWith(` | ${expected}`)) problems.push(`<title> is "${title}"`);

      expect(problems, `expected the spec title "${expected}"`).toEqual([]);
    });
  });
});

/**
 * info.title of the build's one spec. Read from the scenario's copy, so the
 * expected value is whatever the spec declares, never hardcoded here.
 * APIMATIC-META.json sits beside the spec but is settings, not a spec.
 */
function specTitle(portal: GeneratedPortal): string {
  const specDir = path.join(portal.srcDir, "spec");
  const specs = fs
    .readdirSync(specDir)
    .filter((f) => /\.(ya?ml|json)$/i.test(f) && f !== "APIMATIC-META.json");
  expect(specs, "this scenario needs exactly one spec").toHaveLength(1);

  // YAML is a superset of JSON, so one parser covers both.
  const spec = parseYaml(fs.readFileSync(path.join(specDir, specs[0]), "utf-8"));
  return spec.info.title;
}
