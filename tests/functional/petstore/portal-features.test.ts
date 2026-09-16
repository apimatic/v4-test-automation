import { test, expect } from "@playwright/test";
import { DocsPage } from "../../../pages/DocsPage.ts";
import { portalConfig } from "../../../utils/env.ts";

/**
 * The interactive features of a generated portal: search, code-sample language
 * switching, copy-page, and theme persistence.
 *
 * These are behavioural on purpose. A snapshot of the search overlay proves it
 * renders; only a functional test proves searching finds the right page and
 * takes you there.
 */

const { routes } = portalConfig();

test.describe("Petstore portal — features @petstore", () => {
  test("search finds a model and opens it", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);

    await docs.searchFor("PetStatus");
    await docs.openSearchResult("PetStatus");

    expect(page.url()).toContain("/docs/more/models/petstatus");
    await expect(docs.pageHeading).toHaveText("PetStatus");
  });

  test("search surfaces several matches for a broad query", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.quickstart);

    await docs.searchFor("Pet");

    // The spec generates a family of Pet* models, so a broad query should
    // return more than one — a search that silently matched nothing would
    // still render a perfectly stable overlay. Counting matching rows, not all
    // buttons, so the ESC hint and category pills don't pad the number.
    expect(await docs.searchResultsMatching("Pet").count()).toBeGreaterThan(2);
  });

  test("code sample switches language", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.endpoint);

    const curl = await docs.codeSample.textContent();
    expect(curl).toContain("curl");

    await docs.selectCodeLanguage("Python");
    const python = await docs.codeSample.textContent();

    expect(await docs.selectedCodeLanguage()).toBe("Python");
    expect(python).toContain("import requests");
    expect(python).not.toBe(curl);
  });

  test("every advertised language renders a sample", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.endpoint);

    // The build enables 7 platforms; a language tab that renders an empty or
    // unchanged block is a generation bug the visual tests wouldn't catch,
    // because they only ever screenshot one language.
    const tabs = await docs.pageContent.getByRole("tab").allTextContents();
    expect(tabs.length).toBeGreaterThan(1);

    for (const tab of tabs.filter((t) => t.trim() !== "cURL")) {
      await docs.selectCodeLanguage(tab.trim());
      const sample = (await docs.codeSample.textContent())?.trim() ?? "";
      expect(sample.length, `${tab} produced an empty code sample`).toBeGreaterThan(20);
    }
  });

  test("copy page puts the page on the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);

    await docs.copyPageButton.click();

    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()), { timeout: 15_000 })
      .not.toBe("");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.length).toBeGreaterThan(50);
  });

  test("theme choice survives a reload", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.modelObject);

    // The build ships defaultMode: light, so this starts light and must stay
    // dark once chosen — the choice lives in localStorage, not the build file.
    expect(await docs.colorMode()).toBe("light");
    await docs.toggleColorMode();
    expect(await docs.colorMode()).toBe("dark");

    await page.reload({ waitUntil: "domcontentloaded" });
    await docs.waitUntilReady();

    expect(await docs.colorMode()).toBe("dark");
  });

  test("endpoint page renders the request builder from the spec", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.open(routes.endpoint);

    // The one operation the spec defines: DELETE /user/{usersname}.
    await expect(docs.pageContent.getByText("Server URL")).toBeVisible();
    await expect(docs.pageContent.getByRole("button", { name: "Send", exact: true })).toBeVisible();
    await expect(docs.pageContent.getByText("/user/", { exact: false }).first()).toBeVisible();
  });
});
