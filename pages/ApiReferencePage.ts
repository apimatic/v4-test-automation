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
   * digest. An OAuth flow puts the token it fetched here, as "Bearer <token>".
   *
   * Bearer and digest show their scheme as a fixed label in front of the input,
   * and that label joins the input's accessible name: "Authorization Bearer",
   * "Authorization Digest". OAuth and OpenID Connect have no label, so the name
   * is just "Authorization". This matches all three.
   */
  readonly authorizationHeaderInput: Locator;
  /** OAuth 2: opens the Authorize form. Named "Authorize <scheme id>". */
  readonly authorizeButton: Locator;
  /** OAuth 2: submits the Authorize form, which opens in place of the request. */
  readonly oauthSubmitButton: Locator;
  /**
   * The server button in the playground's URL bar, before the path. Its
   * accessible name is the resolved server URL alone, so it doubles as a read
   * of the current server.
   */
  readonly serverUrlButton: Locator;
  /**
   * The "Server URL" popover the button opens: one button per server, then a
   * "Variables" section once a server with variables is picked. It's an
   * unnamed dialog portalled outside the playground, so it's page-scoped and
   * matched by its "Server URL" label.
   */
  readonly serverDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.tryInPlaygroundButton = this.pageContent.getByRole("button", {
      name: "Try in Playground",
      exact: true,
    });
    // The server popover is a dialog too, so pick the playground out by its
    // h2 — the operation name. The popover has no heading.
    this.playground = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("heading", { level: 2 }) });
    this.sendButton = this.playground.getByRole("button", { name: /^Send\b/ });
    // No role or label on the status line, so match its text: a 1xx–5xx code
    // and a reason phrase, which starts with a capital ("200 OK", "404 Not
    // Found"). The capital matters: the timing line beside it ("810 ms · 23 B")
    // also starts with three digits once a call takes 100ms or more.
    this.responseStatus = this.playground.getByText(/^[1-5]\d{2} [A-Z]/);
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
      name: /^Authorization(?: (?:Bearer|Digest))?$/,
    });
    this.authorizeButton = this.playground.getByRole("button", { name: /^Authorize .+/ });
    this.oauthSubmitButton = this.playground.getByRole("button", {
      name: "Authorize",
      exact: true,
    });
    this.serverUrlButton = this.playground.getByRole("button", { name: /^https?:\/\// });
    this.serverDialog = page
      .getByRole("dialog")
      .filter({ has: page.getByText("Server URL", { exact: true }) });
  }

  /**
   * Server-variable labels read "<name> <description>", e.g. "tenant Your
   * tenant subdomain. Free text, editable.", so match the name at the start.
   */
  private serverVariableLabel(name: string): RegExp {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escaped}(?: |$)`);
  }

  /** One of the playground's request sections, by its heading. */
  section(name: PlaygroundSection | "Authorization"): Locator {
    return this.playground.locator("section").filter({
      has: this.page.getByRole("heading", { name, exact: true }),
    });
  }

  /**
   * The request code sample for one language tab — "cURL", "C#", "Python",
   * "TypeScript". Only the selected tab's panel is in the accessibility tree.
   */
  codeSample(language: string): Locator {
    return this.pageContent.getByRole("tabpanel", { name: language, exact: true });
  }

  /**
   * Pick a server in the Server URL popover and close it. `urlTemplate` is the
   * URL as the spec writes it, variables unresolved, e.g.
   * "https://{tenant}.petstore.{region}.example.com/api/v3". Each server is a
   * button named that URL followed by the server's description, so match the start.
   */
  async selectServer(urlTemplate: string): Promise<void> {
    await this.openServerDialog();
    const escaped = urlTemplate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await this.serverDialog.getByRole("button", { name: new RegExp(`^${escaped}`) }).click();
    await this.closeServerDialog();
  }

  /** Open the Server URL popover, unless it's already open. */
  async openServerDialog(): Promise<void> {
    if (!(await this.serverDialog.isVisible())) {
      await this.serverUrlButton.click();
      await this.serverDialog.waitFor({ state: "visible" });
    }
  }

  /**
   * Close the popover and wait until it's gone. Picking a server leaves it
   * open, and it has no Close button; Escape closes it without closing the
   * playground behind it. It animates out and stays "visible" meanwhile —
   * without the wait, a following `openServerDialog()` would see it still up,
   * skip reopening, and act on a popover being removed.
   */
  async closeServerDialog(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await this.serverDialog.waitFor({ state: "hidden" });
  }

  /** A free-text server variable's input, labelled with the variable's name and description. */
  serverVariableInput(name: string): Locator {
    return this.serverDialog.getByRole("textbox", { name: this.serverVariableLabel(name) });
  }

  /** An enum server variable's dropdown, labelled with the variable's name and description. */
  serverVariableSelect(name: string): Locator {
    return this.serverDialog.getByRole("combobox", { name: this.serverVariableLabel(name) });
  }

  /** Type a value into a free-text server variable. Leaves the dialog open. */
  async fillServerVariable(name: string, value: string): Promise<void> {
    await this.openServerDialog();
    await this.serverVariableInput(name).fill(value);
  }

  /** Pick one of an enum server variable's values. Leaves the dialog open. */
  async chooseServerVariable(name: string, value: string): Promise<void> {
    await this.openServerDialog();
    await this.serverVariableSelect(name).click();
    await this.page.getByRole("option", { name: value, exact: true }).click();
  }

  /** Click "Try in Playground" and wait for the dialog. */
  async openPlayground(): Promise<void> {
    await this.tryInPlaygroundButton.click();
    await this.playground.waitFor({ state: "visible" });
    await this.waitForPlaygroundAnimations();
  }

  /**
   * A non-auth parameter input, by the name the spec gives it. Scoped to its
   * section: a path parameter also has an inline input in the URL bar under
   * the same name.
   *
   * String parameters render as a textbox, integer ones as a spinbutton, so
   * either role is accepted.
   */
  parameterField(section: PlaygroundSection, name: string): Locator {
    const scope = this.section(section);
    return scope
      .getByRole("textbox", { name, exact: true })
      .or(scope.getByRole("spinbutton", { name, exact: true }));
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
    await this.authSchemeSelect.click();
    await this.page.getByRole("option", { name: schemes.join(" "), exact: true }).click();
  }

  /**
   * An API key input, by the parameter name the spec gives it and where it's
   * sent. The input is labelled with the name alone and tagged "query" or
   * "header" beside it, so an AND of a query `token` and a header `token`
   * is told apart by that tag.
   *
   * The tag sits next to the input's wrapper div, not inside it, so go up two
   * levels to reach the element that holds both.
   */
  authField(name: string, location: AuthFieldLocation): Locator {
    return this.authorizationSection
      .getByRole("textbox", { name, exact: true })
      .locator("../..")
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
