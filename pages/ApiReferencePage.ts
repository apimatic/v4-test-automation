import { type Locator, type Page, type Response } from "@playwright/test";
import { DocsPage } from "./DocsPage.ts";

/** Where an API key or header credential goes, as the playground labels it. */
export type AuthFieldLocation = "header" | "query" | "cookie";

/** The playground's collapsible request sections, by their button text. */
export type PlaygroundSection = "Path" | "Query" | "Header" | "Body";

/** What the OAuth "Authorize" dialog asks for. Username/password only for the password flow. */
export type OAuthCredentials = {
  clientId: string;
  clientSecret?: string;
  username?: string;
  password?: string;
};

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
  /** Collapsible holding the operation's auth inputs. Closed on load. */
  readonly authorizationToggle: Locator;
  /**
   * Picks which security requirement to fill — one option per OR alternative
   * in the spec, named by its scheme ids joined with spaces. It's the first
   * combobox in the form; the Query section's comboboxes come after it.
   */
  readonly authSchemeSelect: Locator;
  /** Basic auth inputs, inside the Authorization panel. */
  readonly basicUsernameInput: Locator;
  readonly basicPasswordInput: Locator;
  /**
   * The raw Authorization header field, used by bearer, OpenID Connect and
   * digest. Bearer pre-fills it with "Bearer ".
   */
  readonly authorizationHeaderInput: Locator;
  /** OAuth 2: the token field ("Bearer …") and the button that fetches one. */
  readonly accessTokenInput: Locator;
  readonly authorizeButton: Locator;
  /** The OAuth "Authorize" dialog. Rendered outside the form, so page-scoped. */
  readonly oauthDialog: Locator;
  readonly oauthSubmitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.playground = this.pageContent.locator("form").first();
    this.sendButton = this.playground.getByRole("button", { name: "Send", exact: true });
    // No role or label on the status line; it's the only text in the form that
    // starts with a status code.
    this.responseStatus = this.playground.getByText(/^\d{3} \w+/);
    this.responseBody = this.playground.getByRole("region");
    this.authorizationToggle = this.playground.getByRole("button", {
      name: "Authorization",
      exact: true,
    });
    this.authSchemeSelect = this.playground.getByRole("combobox").first();
    // Each field's accessible name is its label plus its type, e.g.
    // "username string", so match on the start.
    this.basicUsernameInput = this.playground.getByRole("textbox", { name: /^username\b/ });
    this.basicPasswordInput = this.playground.getByRole("textbox", { name: /^password\b/ });
    this.authorizationHeaderInput = this.playground.getByRole("textbox", {
      name: /^Authorization \(Header\)/,
    });
    this.accessTokenInput = this.playground.getByRole("textbox", {
      name: "Access Token",
      exact: true,
    });
    this.authorizeButton = this.playground.getByRole("button", { name: "Authorize", exact: true });
    this.oauthDialog = page.getByRole("dialog", { name: "Authorization" });
    this.oauthSubmitButton = this.oauthDialog.getByRole("button", { name: "Submit", exact: true });
  }

  /**
   * A non-auth parameter input, by the name the spec gives it. Labels read
   * "id* string" for required ones and "X-APIMatic-CallbackUrl string" for
   * optional ones, so the asterisk is optional in the match.
   */
  parameterField(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.playground.getByRole("textbox", { name: new RegExp(`^${escaped}\\*? `) });
  }

  /**
   * Expand one of the playground's request sections, unless it's already open.
   * Like Authorization, they're collapsible buttons, closed on load.
   */
  async openSection(section: PlaygroundSection): Promise<void> {
    const toggle = this.playground.getByRole("button", { name: section, exact: true });
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
  }

  /** Set a path, query or header parameter. Pass "" to clear an example value. */
  async fillParameter(section: PlaygroundSection, name: string, value: string): Promise<void> {
    await this.openSection(section);
    await this.parameterField(name).fill(value);
  }

  /**
   * Attach a file to a multipart body's file field. The "Upload" control is a
   * styled label over a hidden file input, the only one in the form.
   */
  async uploadBodyFile(filePath: string): Promise<void> {
    await this.openSection("Body");
    await this.playground.locator('input[type="file"]').setInputFiles(filePath);
  }

  /** Open the Authorization panel, unless it's already open. */
  async openAuthorization(): Promise<void> {
    if ((await this.authorizationToggle.getAttribute("aria-expanded")) !== "true") {
      await this.authorizationToggle.click();
      await this.waitForPlaygroundAnimations();
    }
  }

  /**
   * Wait for the playground's CSS transitions to finish — the panel sliding
   * open after a section is expanded.
   *
   * Clicking inside the panel while it's still moving can land without
   * effect: on a slow CI runner, "Authorize" was clicked 40ms after the panel
   * started opening, the click registered, and its dialog never opened.
   * Playwright's own stability check passed in between two animation frames,
   * so it can't be relied on here.
   */
  async waitForPlaygroundAnimations(): Promise<void> {
    await this.playground.evaluate((el) =>
      Promise.all(
        el
          .getAnimations({ subtree: true })
          // An endless one (a spinner, say) would never finish.
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished),
      ),
    );
  }

  /**
   * Switch to another security requirement, for operations that declare
   * alternatives. `schemes` is the scheme ids of that requirement, in spec
   * order, e.g. ["headerToken", "headerApiKey"].
   */
  async selectAuthScheme(schemes: string[]): Promise<void> {
    await this.openAuthorization();
    await this.authSchemeSelect.click();
    await this.page.getByRole("option", { name: schemes.join(" "), exact: true }).click();
  }

  /**
   * An API key input, by the parameter name the spec gives it and where it's
   * sent — the playground labels these "token (query)", "accesstoken (header)".
   */
  authField(name: string, location: AuthFieldLocation): Locator {
    const label = `${name} (${location})`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.playground.getByRole("textbox", { name: new RegExp(`^${label}`) });
  }

  /** Open the Authorization panel and enter Basic credentials. */
  async fillBasicAuth(username: string, password: string): Promise<void> {
    await this.openAuthorization();
    await this.basicUsernameInput.fill(username);
    await this.basicPasswordInput.fill(password);
  }

  /** Open the Authorization panel and fill one API key input. */
  async fillAuthField(name: string, location: AuthFieldLocation, value: string): Promise<void> {
    await this.openAuthorization();
    await this.authField(name, location).fill(value);
  }

  /** Open the Authorization panel and set the Authorization header outright. */
  async fillAuthorizationHeader(value: string): Promise<void> {
    await this.openAuthorization();
    await this.authorizationHeaderInput.fill(value);
  }

  /** Open the Authorization panel and paste an OAuth token in, skipping the flow. */
  async fillAccessToken(value: string): Promise<void> {
    await this.openAuthorization();
    await this.accessTokenInput.fill(value);
  }

  /**
   * Run an OAuth flow through the "Authorize" dialog: fill it and submit.
   *
   * For client credentials and password the portal fetches the token itself
   * and fills it in. For authorization code, Submit navigates away to the
   * authorization URL and the token is exchanged once the page comes back —
   * wait on `accessTokenInput` either way.
   */
  async authorizeWithOAuth(credentials: OAuthCredentials): Promise<void> {
    await this.openAuthorization();
    await this.authorizeButton.click();
    const fields: [string, string | undefined][] = [
      ["Client ID", credentials.clientId],
      ["Client Secret", credentials.clientSecret],
      ["Username", credentials.username],
      ["Password", credentials.password],
    ];
    for (const [label, value] of fields) {
      if (value !== undefined) {
        await this.oauthDialog.getByRole("textbox", { name: label, exact: true }).fill(value);
      }
    }
    await this.oauthSubmitButton.click();
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
