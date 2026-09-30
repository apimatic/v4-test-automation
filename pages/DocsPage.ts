import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage.ts";
import { settle } from "../utils/visual.ts";

/**
 * Page object for any page of a v4 portal — the static bundle
 * `apimatic portal generate` produces.
 *
 * Every route renders the same chrome, so one class covers the landing page,
 * authored guides, the component showcase, the generated SDK and plugin pages
 * and the API reference alike.
 *
 * Locators key off the portal's own stable ids (`nd-*` / `fd-*`, inherited from
 * fumadocs) and off roles and aria-labels. Never off a Tailwind utility class —
 * those churn on every restyle. Note the dialog Radix renders carries a
 * generated id (`radix-_R_6j6_`), so the search overlay is matched by role.
 */
export class DocsPage extends BasePage {
  /** Top bar: portal title, search, theme toggle. */
  readonly subnav: Locator;
  /** Left navigation tree. */
  readonly sidebar: Locator;
  /** The article body — page content without the surrounding chrome. */
  readonly pageContent: Locator;
  /** "On this page" — only rendered for pages with enough headings. */
  readonly toc: Locator;
  /**
   * Light/dark switch: one button holding two icons, sun then moon.
   *
   * Clicking the button itself lands between the icons and does nothing, so
   * `setColorMode()` clicks the icon for the mode you want. Matched on
   * `[data-theme-toggle]`, which the portal puts there deliberately.
   */
  readonly themeToggle: Locator;
  /** The "Search  Ctrl K" pill in the top bar. */
  readonly searchButton: Locator;
  /** The search overlay, once opened. */
  readonly searchDialog: Locator;
  readonly searchInput: Locator;
  /** Result rows live in this list. */
  readonly searchList: Locator;
  /** Copies the page as markdown — part of the AI page actions. */
  readonly copyMarkdownButton: Locator;
  readonly pageHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.subnav = page.locator("#nd-subnav");
    this.sidebar = page.locator("#nd-sidebar");
    this.pageContent = page.locator("#nd-page");
    this.toc = page.locator("#nd-toc-placeholder");
    this.themeToggle = page.locator("[data-theme-toggle]").first();
    this.searchButton = this.subnav.getByRole("button", { name: /Search/ }).first();
    this.searchDialog = page.getByRole("dialog");
    this.searchInput = this.searchDialog.getByPlaceholder("Search");
    this.searchList = page.locator("#fd-search-list");
    this.copyMarkdownButton = page.getByRole("button", { name: /Copy Markdown/i }).first();
    this.pageHeading = this.pageContent.locator("h1").first();
  }

  /** Navigate to a portal route and wait until it's stable enough to screenshot. */
  async open(route: string): Promise<void> {
    await this.page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await this.waitUntilReady();
  }

  /** Content rendered, chrome present, fonts loaded, animations finished. */
  async waitUntilReady(): Promise<void> {
    await this.pageContent.waitFor({ state: "visible", timeout: 60_000 });
    await this.pageHeading.waitFor({ state: "visible", timeout: 60_000 });
    await settle(this.page);
  }

  /** "light" or "dark", read off the <html> class. */
  async colorMode(): Promise<"light" | "dark"> {
    const classes = (await this.page.locator("html").getAttribute("class")) ?? "";
    return classes.split(/\s+/).includes("dark") ? "dark" : "light";
  }

  /**
   * Choose a colour mode and wait for the class swap to land.
   *
   * The icons are decorative (`aria-hidden`), so they're addressed by position
   * inside the control — sun first, moon second — rather than by role.
   */
  async setColorMode(mode: "light" | "dark"): Promise<void> {
    if ((await this.colorMode()) === mode) return;
    const icon = this.themeToggle.locator("svg");
    // `force` because the icons are decorative (`aria-hidden`) children of the
    // button, so Playwright's actionability checks never settle on them. The
    // button itself is the real control and is checked by the poll below —
    // if the click missed, the mode wouldn't change and this would still fail.
    await (mode === "dark" ? icon.last() : icon.first()).click({ force: true });
    await expect.poll(() => this.colorMode(), { timeout: 10_000 }).toBe(mode);
    await settle(this.page);
  }

  /** Flip to the other colour mode. */
  async toggleColorMode(): Promise<void> {
    await this.setColorMode((await this.colorMode()) === "light" ? "dark" : "light");
  }

  /** Open the search overlay and wait for its input to be ready. */
  async openSearch(): Promise<void> {
    await this.searchButton.click();
    await this.searchDialog.waitFor({ state: "visible", timeout: 30_000 });
    await this.searchInput.waitFor({ state: "visible", timeout: 30_000 });
    await settle(this.page);
  }

  /**
   * Result rows matching `text`, scoped to the results list.
   *
   * The rows are `button[role="option"]`, not links — a combobox listbox rather
   * than a list of anchors, so `getByRole("link")` finds nothing here.
   */
  searchResultsMatching(text: string): Locator {
    return this.searchList.getByRole("option").filter({ hasText: text });
  }

  /** Type a query and wait for real results rather than a fixed delay. */
  async searchFor(query: string): Promise<void> {
    await this.openSearch();
    await this.searchInput.fill(query);
    await this.searchResultsMatching(query)
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
    await settle(this.page);
  }

  /**
   * Open the first search row containing `text`.
   *
   * Waits for the URL to change first: the page we came from satisfies
   * `waitUntilReady()` just as well as the one we're going to, so without this
   * the caller can read the old URL and think navigation failed.
   */
  async openSearchResult(text: string): Promise<void> {
    const from = this.page.url();
    await this.searchResultsMatching(text).first().click();
    await expect.poll(() => this.page.url(), { timeout: 30_000 }).not.toBe(from);
    await this.waitUntilReady();
  }

  /** True when the portal chrome rendered — cheap smoke check. */
  async isPortalChromeDisplayed(): Promise<boolean> {
    await this.subnav.waitFor({ state: "visible", timeout: 30_000 });
    await this.pageContent.waitFor({ state: "visible", timeout: 30_000 });
    return true;
  }
}
