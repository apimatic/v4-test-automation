import { type Locator, type Page, type Response } from "@playwright/test";
import { DocsPage } from "./DocsPage.ts";

/**
 * An endpoint page of the API reference, with its "try it" playground.
 *
 * The playground is a plain `<form>` with no accessible name, so it isn't
 * reachable by role — it's the only form in the article, so it's matched by tag.
 * Everything inside it is matched by role or text.
 */
export class ApiReferencePage extends DocsPage {
  /** Server URL, method + path, Send, and the response once a call is made. */
  readonly playground: Locator;
  readonly sendButton: Locator;
  /** "200 Successful" — the status line the response panel opens with. */
  readonly responseStatus: Locator;
  /** The response body's code block. The only region in the form. */
  readonly responseBody: Locator;

  constructor(page: Page) {
    super(page);
    this.playground = this.pageContent.locator("form").first();
    this.sendButton = this.playground.getByRole("button", { name: "Send", exact: true });
    // No role or label on the status line; it's the only text in the form that
    // starts with a status code.
    this.responseStatus = this.playground.getByText(/^\d{3} \w+/);
    this.responseBody = this.playground.getByRole("region");
  }

  /**
   * Click Send and wait for the API's answer.
   *
   * The playground calls the API straight from the browser, so its call is the
   * only fetch that leaves the portal's origin. The listener is set up before
   * the click so a fast response can't be missed.
   */
  async sendRequest(): Promise<Response> {
    const portalOrigin = new URL(this.page.url()).origin;
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) =>
          ["fetch", "xhr"].includes(r.request().resourceType()) &&
          new URL(r.url()).origin !== portalOrigin,
        { timeout: 30_000 },
      ),
      this.sendButton.click(),
    ]);
    return response;
  }
}
