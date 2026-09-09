import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage.ts";
import { settle } from "../utils/visual.ts";

/**
 * Page object for any page of a generated dxV2 portal.
 *
 * Every route in the portal renders the same chrome — header, section nav,
 * sidebar, article — so one class covers guide pages, endpoint/playground pages
 * and the generated Quickstart alike. The ids below are the portal's own stable
 * ids (`nd-*` / `fd-*`, inherited from fumadocs); the utility classes around
 * them are Tailwind and churn constantly, so nothing here keys off a class name.
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
  /** Top-level section tabs — Home / Documentation / API Reference / SDKs / MCP. */
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
   * Collapses the desktop sidebar. Only rendered on pages whose sidebar is
   * collapsible — present on the API Reference pages, absent on Quickstart.
   */
  readonly collapseSidebarButton: Locator;
  readonly expandSidebarButton: Locator;
  /** The search overlay, once opened. */
  readonly searchDialog: Locator;
  readonly searchInput: Locator;
  readonly pageHeading: Locator;

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
    this.pageHeading = this.pageContent.getByRole("heading", { level: 1 });
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
    await this.pageHeading.first().waitFor({ state: "visible", timeout: 60_000 });
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

  /** True when the portal chrome rendered — cheap smoke check. */
  async isPortalChromeDisplayed(): Promise<boolean> {
    await this.header.waitFor({ state: "visible", timeout: 30_000 });
    await this.sidebar.waitFor({ state: "visible", timeout: 30_000 });
    return true;
  }
}
