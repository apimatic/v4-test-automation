import type { Page } from "@playwright/test";

/** Holds the Playwright `page` every page object needs. */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}
