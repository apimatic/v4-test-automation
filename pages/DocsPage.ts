import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage.ts";
import { settle } from "../utils/visual.ts";

/**
 * Page object for any page of a generated dxV2 portal.
 *
 * Every route renders the same chrome — header, sidebar, article — so one class
 * covers guide pages, endpoint/playground pages, generated Models pages and the
 * generated Quickstart alike. Locators key off the portal's own stable ids
 * (`nd-*` / `fd-*`, inherited from fumadocs) and off `portal-page-title`, which
 * the portal applies deliberately and its generated theme.css styles. Never off
 * a Tailwind utility class — those churn on every restyle.
 *
 * Two things are build-dependent rather than universal, so check before
 * asserting: the section-tab nav (absent when a build has no top-level groups)
 * and the sidebar (rendered but hidden on a page whose section holds one entry).
 *
 * Careful with the header: it renders several responsive variants of the same
 * control, and only one of them is ever displayed. The icon-only buttons
 * (`Open Search`, `Open Sidebar`) are the small-screen variants and are
 * `display: none` at desktop widths — hence the search locator scoping to the
 * visible pill rather than the icon button.
 */
export class DocsPage extends BasePage {
  /** Sticky top bar: portal title, version, search, Ask AI, theme toggle. */
  readonly header: Locator;
  /**
   * Top-level section tabs. Build-dependent: a build whose toc.yml has several
   * top-level groups renders them here, but the petstore build has none and the
   * element is absent entirely. Check `count()` before asserting on it.
   */
  readonly portalNav: Locator;
  /** Left navigation tree. */
  readonly sidebar: Locator;
  /** The article body — page content without the surrounding chrome. */
  readonly pageContent: Locator;
  /** Fixed "Ask AI" bar pinned to the bottom of the viewport. */
  readonly askAiBar: Locator;
  /** Light/dark switch. Its label names the mode it switches *to*. */
  readonly themeToggle: Locator;
  /** The "Search  Ctrl K" pill in the header — the desktop search control. */
  readonly searchButton: Locator;
  /**
   * Collapses the desktop sidebar. Only rendered where the sidebar itself is —
   * present on the Models and endpoint pages, absent on the petstore Quickstart,
   * whose section holds a single entry.
   */
  readonly collapseSidebarButton: Locator;
  readonly expandSidebarButton: Locator;
  /** The search overlay, once opened. */
  readonly searchDialog: Locator;
  readonly searchInput: Locator;
  /**
   * The portal's own page title. Scoped to `.portal-page-title` — the class the
   * portal puts on it (components/page-header, and the generated theme.css
   * targets it for typography) — because a generated Models page renders TWO
   * h1s: this one and the MDX content's own heading. Matching on level alone
   * is a strict-mode violation there.
   */
  readonly pageHeading: Locator;
  /** The "On this page" table of contents. Absent on pages with no headings. */
  readonly toc: Locator;
  /** Copies the page as markdown. Sits beside the page title. */
  readonly copyPageButton: Locator;
  /** Previous / Next links at the foot of the article. */
  readonly footerPrevious: Locator;
  readonly footerNext: Locator;
  /** Language tabs over an endpoint's code sample (cURL, Python, Go, …). */
  readonly codeSampleTabs: Locator;
  /** The code sample itself — whichever language tab is selected. */
  readonly codeSample: Locator;
  /**
   * Rows in the search overlay. They're buttons, not links, and they sit among
   * other buttons — the ESC hint, the category pills, and the Ask AI row — so
   * prefer `searchResultsMatching()` when you mean "results for this query".
   */
  readonly searchResults: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.locator("#nd-portal-header");
    this.portalNav = page.getByRole("navigation", { name: "Portal sections" });
    this.sidebar = page.locator("#nd-sidebar");
    this.pageContent = page.locator("#nd-page");
    this.askAiBar = page.locator("#nd-ask-ai-bar");
    this.themeToggle = page.getByRole("button", { name: /Switch to (dark|light) theme/ });
    this.searchButton = this.header.getByRole("button", { name: /Search/ });
    this.collapseSidebarButton = this.header.getByRole("button", { name: "Collapse sidebar" });
    this.expandSidebarButton = this.header.getByRole("button", { name: "Expand sidebar" });
    this.searchDialog = page.locator("#fd-search-dialog-content");
    this.searchInput = this.searchDialog.getByPlaceholder("Search");
    this.pageHeading = this.pageContent.locator("h1.portal-page-title");
    this.toc = page.locator("#nd-toc");
    this.copyPageButton = this.pageContent.getByRole("button", { name: /Copy page/i }).first();
    this.footerPrevious = this.pageContent.locator("a[href]").filter({ hasText: "Previous" });
    this.footerNext = this.pageContent.locator("a[href]").filter({ hasText: "Next" });
    this.codeSampleTabs = this.pageContent.getByRole("tablist");
    this.codeSample = this.pageContent.locator("pre").first();
    this.searchResults = this.searchDialog.getByRole("button");
  }

  /**
   * Switch the endpoint code sample to a language and wait for the sample to
   * actually change — the tab going `aria-selected` fires before the new
   * snippet renders, so asserting on the tab alone would pass on stale code.
   */
  async selectCodeLanguage(language: string): Promise<void> {
    const before = await this.codeSample.textContent();
    await this.pageContent.getByRole("tab", { name: language, exact: true }).click();
    await expect.poll(() => this.codeSample.textContent(), { timeout: 15_000 }).not.toBe(before);
    await settle(this.page);
  }

  /** Which code-sample language is currently selected. */
  async selectedCodeLanguage(): Promise<string> {
    return (
      (await this.pageContent.locator('[role="tab"][aria-selected="true"]').first().textContent())
        ?.trim() ?? ""
    );
  }

  /**
   * Result rows matching `text`.
   *
   * The Ask AI row echoes the query back ("Ask about “PetStatus”"), so a
   * plain `hasText` filter matches it too — and since the list re-renders while
   * results stream in, `.first()` on that filter can land on Ask AI and open the
   * assistant instead of navigating. Excluding it by its label is what makes
   * this deterministic.
   */
  searchResultsMatching(text: string): Locator {
    return this.searchDialog
      .getByRole("button")
      .filter({ hasText: text })
      .filter({ hasNotText: "Ask AI" });
  }

  /** Type a query into the search overlay and wait for real results to arrive. */
  async searchFor(query: string): Promise<void> {
    await this.openSearch();
    await this.searchInput.fill(query);
    // Wait for an actual result row rather than a fixed delay — and not merely
    // for any button, or we'd race the Ask AI row that renders immediately.
    await this.searchResultsMatching(query)
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
    await settle(this.page);
  }

  /**
   * Open the first search row whose label contains `text`.
   *
   * Waits for the URL to actually change before settling: the page we came from
   * satisfies `waitUntilReady()` just as well as the one we're going to, so
   * without this the caller can read the old URL and think navigation failed.
   */
  async openSearchResult(text: string): Promise<void> {
    const from = this.page.url();
    await this.searchResultsMatching(text).first().click();
    await expect.poll(() => this.page.url(), { timeout: 30_000 }).not.toBe(from);
    await this.waitUntilReady();
  }

  /**
   * Navigate to a portal route and wait until the page is stable enough to
   * screenshot. The dev server compiles routes on first request, so the first
   * visit to a page can take a while.
   */
  async open(route: string): Promise<void> {
    await this.page.goto(route, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await this.waitUntilReady();
  }

  /** Content rendered, chrome present, fonts loaded, animations finished. */
  async waitUntilReady(): Promise<void> {
    await this.pageContent.waitFor({ state: "visible", timeout: 60_000 });
    await this.pageHeading.waitFor({ state: "visible", timeout: 60_000 });
    await settle(this.page);
  }

  /** "light" or "dark", read off the <html> class next-themes maintains. */
  async colorMode(): Promise<"light" | "dark"> {
    const classes = (await this.page.locator("html").getAttribute("class")) ?? "";
    return classes.split(/\s+/).includes("dark") ? "dark" : "light";
  }

  /** Flip the theme and wait for the class swap to land. */
  async toggleColorMode(): Promise<void> {
    const before = await this.colorMode();
    await this.themeToggle.click();
    await expect.poll(() => this.colorMode(), { timeout: 10_000 }).not.toBe(before);
    await settle(this.page);
  }

  /** Open the search overlay and wait for its input to be focusable. */
  async openSearch(): Promise<void> {
    await this.searchButton.click();
    await this.searchDialog.waitFor({ state: "visible", timeout: 30_000 });
    await this.searchInput.waitFor({ state: "visible", timeout: 30_000 });
    await settle(this.page);
  }

  /**
   * Collapse the sidebar and wait for the header control to flip to "Expand",
   * which is the portal's own signal that the collapse finished.
   */
  async collapseSidebar(): Promise<void> {
    await this.collapseSidebarButton.click();
    await this.expandSidebarButton.waitFor({ state: "visible", timeout: 15_000 });
    await settle(this.page);
  }

  /**
   * True when the portal chrome rendered — cheap smoke check.
   *
   * Header and article only: the sidebar is not universal. On a page whose
   * section holds a single entry (the petstore Quickstart) it renders but stays
   * hidden, so asserting on it here would fail for reasons that have nothing to
   * do with the chrome being broken. Use `isSidebarDisplayed()` where it matters.
   */
  async isPortalChromeDisplayed(): Promise<boolean> {
    await this.header.waitFor({ state: "visible", timeout: 30_000 });
    await this.pageContent.waitFor({ state: "visible", timeout: 30_000 });
    return true;
  }

  /** True once the navigation tree is on screen. */
  async isSidebarDisplayed(): Promise<boolean> {
    await this.sidebar.waitFor({ state: "visible", timeout: 30_000 });
    return true;
  }
}
