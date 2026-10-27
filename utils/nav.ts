/**
 * Shared by the nav.json suites — tests/artifacts/petstore/nav-validation and
 * tests/visual/petstore/nav.visual — which both edit copies of the petstore
 * build. Helpers return `files` entries for a ScenarioChanges, so a case reads
 * as the nav.json it's testing.
 */

/** The build both suites copy. */
export const NAV_BUILD = "petstore";

/**
 * The pages the nav.json sheet places that petstore doesn't have: a page
 * directly under content/ (authentication) and a folder to make a tab
 * (tutorials). Petstore's own guides/ is the sheet's folder kept in Home.
 *
 * Spread into a case's `files`. A case that moves one of them lists the
 * other on its own instead.
 */
export const SHEET_PAGES: Record<string, string> = {
  "content/authentication.md": page("Authentication"),
  "content/tutorials/first.md": page("First Tutorial"),
};

/**
 * The nav.json the sheet's cases start from (its TC-05). It replaces
 * petstore's committed one, which makes every folder a tab.
 */
export const BASE_NAV = {
  title: "Overview",
  tabs: ["tutorials", "apimatic:sdks"],
  pages: ["index", "guides", "apimatic:plugin", "authentication", "..."],
};

/**
 * A nav.json for a case. Pass the whole object: it replaces the file rather
 * than merging, so what the test shows is exactly what the CLI reads.
 */
export function nav(content: unknown, file = "content/nav.json"): Record<string, string> {
  return { [file]: JSON.stringify(content, null, 2) };
}

/** A markdown page with a title, so the sidebar and tab bar show it by that name. */
export function page(title: string): string {
  return `---\ntitle: ${title}\n---\n\n${title}.\n`;
}
