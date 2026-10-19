import { type Locator, type Page, type Response } from "@playwright/test";
import { DocsPage } from "./DocsPage.ts";

/** Where an API key or header credential goes, as the playground tags it. */
export type AuthFieldLocation = "header" | "query" | "cookie";

/** The playground's request sections, by their heading. */
export type PlaygroundSection = "Path" | "Query" | "Header" | "Body";

/** What the OAuth "Authorize" form asks for. Username/password only for the password flow. */
export type OAuthCredentials = {
  clientId: string;
  clientSecret?: string;
  username?: string;
  password?: string;
};

/**
 * An endpoint page of the API reference, with its "try it" playground.
 *
 * The playground is a dialog, opened by "Try in Playground" and named after
 * the operation. Inside it, each part of the request — Authorization, Path,
 * Query, Header, Body — is a `<section>` under an h3 of that name, always
 * expanded. Everything else is matched by role or text.
 */
export class ApiReferencePage extends DocsPage {
  /** Opens the playground. On the page, beside the method and path. */
  readonly tryInPlaygroundButton: Locator;
  /** The playground dialog: server URL, method + path, Send, and the response once a call is made. */
  readonly playground: Locator;
  /** Named "Send Ctrl ↵" — the keyboard shortcut is part of its text. */
  readonly sendButton: Locator;
  /** "200 OK" — the status line the response opens with. */
  readonly responseStatus: Locator;
  /** The response body's code block, under the response's "Body" tab. */
  readonly responseBody: Locator;
  /** The section holding the operation's auth inputs. */
  readonly authorizationSection: Locator;
  /**
   * Picks which security requirement to fill — one option per OR alternative
   * in the spec, named by its scheme ids joined with spaces. Only rendered for
   * operations that declare alternatives.
   */
  readonly authSchemeSelect: Locator;
  /** Basic auth inputs. */
  readonly basicUsernameInput: Locator;
  readonly basicPasswordInput: Locator;
  /**
   * The Authorization header field, used by bearer, OAuth 2, OpenID Connect and
   * digest. Bearer and OAuth pre-fill it with "Bearer ", and an OAuth flow
   * puts the token it fetched here.
   */
  readonly authorizationHeaderInput: Locator;
  /** OAuth 2: opens the Authorize form. Named "Authorize <scheme id>". */
  readonly authorizeButton: Locator;
  /** OAuth 2: submits the Authorize form, which opens in place of the request. */
  readonly oauthSubmitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.tryInPlaygroundButton = this.pageContent.getByRole("button", {
      name: "Try in Playground",
      exact: true,
    });
    this.playground = page.getByRole("dialog");
    this.sendButton = this.playground.getByRole("button", { name: /^Send\b/ });
    // No role or label on the status line; it's the only text in the dialog
    // that starts with a status code.
    this.responseStatus = this.playground.getByText(/^\d{3} \w+/);
    this.responseBody = this.playground
      .getByRole("tabpanel", { name: "Body", exact: true })
      .getByRole("region");
    this.authorizationSection = this.section("Authorization");
    this.authSchemeSelect = this.authorizationSection.getByRole("combobox");
    this.basicUsernameInput = this.authorizationSection.getByRole("textbox", {
      name: "username",
      exact: true,
    });
    this.basicPasswordInput = this.authorizationSection.getByRole("textbox", {
      name: "password",
      exact: true,
    });
    this.authorizationHeaderInput = this.authorizationSection.getByRole("textbox", {
      name: "Authorization",
      exact: true,
    });
    this.authorizeButton = this.playground.getByRole("button", { name: /^Authorize .+/ });
    this.oauthSubmitButton = this.playground.getByRole("button", {
      name: "Authorize",
      exact: true,
    });
  }

  /** One of the playground's request sections, by its heading. */
  section(name: PlaygroundSection | "Authorization"): Locator {
    return this.playground.locator("section").filter({
      has: this.page.getByRole("heading", { name, exact: true }),
    });
  }

  /** Click "Try in Playground" and wait for the dialog. */
  async openPlayground(): Promise<void> {
    await this.tryInPlaygroundButton.click();
    await this.playground.waitFor({ state: "visible" });
  }

  /**
   * A non-auth parameter input, by the name the spec gives it. Scoped to its
   * section: a path parameter also has an inline input in the URL bar under
   * the same name.
   */
  parameterField(section: PlaygroundSection, name: string): Locator {
    return this.section(section).getByRole("textbox", { name, exact: true });
  }

  /** Set a path, query or header parameter. Pass "" to clear an example value. */
  async fillParameter(section: PlaygroundSection, name: string, value: string): Promise<void> {
    await this.parameterField(section, name).fill(value);
  }

  /**
   * Attach a file to a multipart body's file field. The "Choose a file" control
   * is a styled button over a hidden file input, the only one in the dialog.
   */
  async uploadBodyFile(filePath: string): Promise<void> {
    await this.section("Body").locator('input[type="file"]').setInputFiles(filePath);
  }

  /**
   * Switch to another security requirement, for operations that declare
   * alternatives. `schemes` is the scheme ids of that requirement, in spec
   * order, e.g. ["headerToken", "headerApiKey"].
   */
  async selectAuthScheme(schemes: string[]): Promise<void> {
    await this.authSchemeSelect.click();
    await this.page.getByRole("option", { name: schemes.join(" "), exact: true }).click();
  }

  /**
   * An API key input, by the parameter name the spec gives it and where it's
   * sent. The input is labelled with the name alone and tagged "query" or
   * "header" beside it, so an AND of a query `token` and a header `token`
   * is told apart by that tag.
   */
  authField(name: string, location: AuthFieldLocation): Locator {
    return this.authorizationSection
      .getByRole("textbox", { name, exact: true })
      .locator("..")
      .filter({ hasText: location })
      .getByRole("textbox");
  }

  /** Enter Basic credentials. */
  async fillBasicAuth(username: string, password: string): Promise<void> {
    await this.basicUsernameInput.fill(username);
    await this.basicPasswordInput.fill(password);
  }

  /** Fill one API key input. */
  async fillAuthField(name: string, location: AuthFieldLocation, value: string): Promise<void> {
    await this.authField(name, location).fill(value);
  }

  /** Set the Authorization header outright — also how an OAuth token is pasted in. */
  async fillAuthorizationHeader(value: string): Promise<void> {
    await this.authorizationHeaderInput.fill(value);
  }

  /**
   * Run an OAuth flow through the Authorize form: fill it and submit.
   *
   * For client credentials and password the portal fetches the token itself
   * and fills it in. For authorization code, Submit navigates away to the
   * authorization URL and the token is exchanged once the page comes back —
   * wait on `authorizationHeaderInput` either way.
   */
  async authorizeWithOAuth(credentials: OAuthCredentials): Promise<void> {
    await this.authorizeButton.click();
    const fields: [string, string | undefined][] = [
      ["client_id", credentials.clientId],
      ["client_secret", credentials.clientSecret],
      ["username", credentials.username],
      ["password", credentials.password],
    ];
    for (const [label, value] of fields) {
      if (value !== undefined) {
        await this.playground.getByRole("textbox", { name: label, exact: true }).fill(value);
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
