import { test, expect } from "@playwright/test";
import type { GeneratedPortal } from "../../../utils/artifacts.ts";
import { generateScenario, type ScenarioChanges } from "../../../utils/scenario.ts";

/**
 * Stage 1: the `portal.brand` block of apimatic.json against what the CLI
 * produced. One describe per row of the portal.brand section in the QA sheet.
 *
 * The favicon is declared as a path under static/, and the generator writes it
 * into every page as <link rel="icon" href="..." type="...">, with the MIME
 * type taken from the file's extension. A wrong type can make a browser ignore
 * the icon, so the type is checked, not just the path.
 */

/** The MIME type each favicon format must be served as (IANA registry). */
const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  svg: "image/svg+xml",
};

/** A minimal valid SVG, so the svg case doesn't depend on a file in the build. */
const SVG_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#b91c1c"/></svg>\n';

/**
 * One case per format in the sheet row. `files` adds what the build doesn't
 * already have: petstore ships a .png (logo.png) but no .svg.
 */
const FAVICON_CASES: Array<{ format: string; path: string; files?: ScenarioChanges["files"] }> = [
  { format: "png", path: "static/images/logo.png" },
  { format: "svg", path: "static/images/favicon.svg", files: { "static/images/favicon.svg": SVG_ICON } },
];

test.describe("Petstore — portal.brand @artifacts", () => {
  for (const { format, path, files } of FAVICON_CASES) {
    test.describe(`.${format} favicon`, () => {
      let portal: GeneratedPortal;

      test.beforeAll(async () => {
        portal = await generateScenario(
          `${format} favicon`,
          {
            files,
            config: (config) => {
              config.portal!.brand!.favicon = path;
            },
          },
          { build: "petstore" },
        );
      });
      test.afterAll(() => portal?.cleanup());

      test("the favicon link carries the correct MIME type", () => {
        // Read the declared side off the scenario's own apimatic.json.
        const declared = portal.config().portal?.brand?.favicon;
        expect(declared, "portal.brand.favicon in the scenario's apimatic.json").toBe(path);

        // static/ is the web root: static/images/x.png is served as /images/x.png.
        const servedPath = declared!.replace(/^static\//, "");
        const expectedHref = `/${servedPath}`;
        const expectedType = MIME_TYPES[format];

        const html = portal.read("index.html");
        const link = html.match(/<link[^>]*rel="icon"[^>]*>/)?.[0];
        const href = link?.match(/href="([^"]*)"/)?.[1];
        const type = link?.match(/type="([^"]*)"/)?.[1];

        // Collected and asserted once, so a run reports every problem.
        // "Missing" and "wrong" are different defects, so they read differently.
        const problems: string[] = [];
        if (!link) {
          problems.push('<link rel="icon"> is missing from index.html');
        } else {
          if (href === undefined) problems.push("the icon link has no href");
          else if (href !== expectedHref) problems.push(`href is "${href}", expected "${expectedHref}"`);
          if (type === undefined) problems.push("the icon link has no type attribute");
          else if (type !== expectedType) problems.push(`type is "${type}", expected "${expectedType}"`);
        }
        // The link is no use if the file it points to wasn't copied into the bundle.
        if (!portal.exists(...servedPath.split("/"))) {
          problems.push(`${servedPath} is missing from the generated portal`);
        }

        expect(problems, `favicon ${declared}`).toEqual([]);
      });
    });
  }
});
