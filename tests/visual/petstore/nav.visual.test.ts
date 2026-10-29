import { test, expect, type Page } from "@playwright/test";
import { DocsPage } from "../../../pages/DocsPage.ts";
import { getPortal } from "../../../config/portals.ts";
import type { GeneratedPortal } from "../../../utils/artifacts.ts";
import { BASE_NAV, NAV_BUILD, SHEET_PAGES, nav, page } from "../../../utils/nav.ts";
import { cliWarnings, generateScenario, type ScenarioChanges } from "../../../utils/scenario.ts";
import { scenarioBaseURL, serveDir, type ServedPortal } from "../../../utils/serve.ts";
import { elementSnapshotOptions } from "../../../utils/visual.ts";

/**
 * Stage 2 for nav.json: what the portal looks like for each layout that builds.
 *
 * Every describe is a row of the nav.json sheet in the QA RTM (issue #7) whose
 * build succeeds. The rows the CLI refuses — validation errors, no portal —
 * aren't automated here; the Testing Skill covers them.
 *
 * Each scenario edits its own copy of the petstore build — the same way the
 * artifact tests do — generates it (~25s in CI) and serves it on the scenario port
 * (utils/serve.ts), so the committed portal the other visual tests use is
 * never touched. Its tests then:
 *
 *   - check the warnings the CLI printed while generating. They come from the
 *     same run that produced the portal, so asking for them costs nothing;
 *   - assert the tab bar and the sidebar in words, then snapshot both — the
 *     assertion catches a wrong label or order, the snapshot catches a layout
 *     that renders the right words badly;
 *   - load the addresses the row says must keep working.
 *
 * Petstore has more in it than the sheet's portal: its home page is titled
 * "TT Status Codes" rather than "Welcome", and it has components/ and gfm/
 * folders the sheet never names. Those land wherever "..." puts them, so the
 * sidebar checks hold the entries nav.json names to an exact order and only
 * ask that the rest are there; the snapshot records the full layout.
 *
 * Expected warnings are the sheet's, with the CLI's quoting: it puts names in
 * single quotes and calls the file 'content/nav.json', where the sheet writes
 * src/content/nav.json.
 *
 * Baselines: portal-snapshots/visual/petstore/tc-*.png. Update with
 * `pnpm test:nav:visual:update` and look at them before committing.
 */

const { routes } = getPortal(NAV_BUILD);

// Every page in here is served by the scenario's own server, not the
// project's webServer.
test.use({ baseURL: scenarioBaseURL() });

/** Petstore's content/index.md — the page Home opens on. The sheet calls it Welcome. */
const HOME_PAGE = "TT Status Codes";

/**
 * Petstore with only its home page and the three generated sections — the
 * scaffolded portal TC-01 to TC-04 start from.
 */
const SCAFFOLD: ScenarioChanges = {
  remove: ["content/components", "content/gfm", "content/guides"],
};

const NO_TABS_NOTICE = (suggested: string) =>
  `'content/nav.json' has no 'tabs', so nothing is a tab: the header shows no tab bar, and ` +
  `SDKs, Context Plugin and the API reference are folders in Home's sidebar. Add ` +
  `'"tabs": ${suggested}' to show them as tabs, or '"tabs": []' to keep this sidebar.`;

const TITLE_WARNING =
  "'content/nav.json' names the Home tab with 'title', but Home is the only tab and one tab " +
  "draws no tab bar, so the name shows nowhere. Name a tab in 'tabs', or remove the setting.";

/**
 * One sheet row: generate the scenario and serve it for the tests inside.
 * Each row is a real generation, so its tests share it rather than repeating it.
 */
function scenario(
  title: string,
  changes: ScenarioChanges,
  body: (portal: () => GeneratedPortal) => void,
): void {
  test.describe(title, () => {
    // Generation plus serving runs in beforeAll, which shares the test timeout.
    test.describe.configure({ timeout: 300_000 });

    let portal: GeneratedPortal;
    let server: ServedPortal | undefined;

    test.beforeAll(async () => {
      portal = await generateScenario(title, changes, { build: NAV_BUILD });
      server = await serveDir(portal.outDir);
    });
    test.afterAll(async () => {
      await server?.stop();
      portal?.cleanup();
    });

    body(() => portal);
  });
}

/** Each path renders a page. */
async function expectRoutesLoad(page: Page, paths: string[]): Promise<void> {
  const docs = new DocsPage(page);
  for (const path of paths) {
    await docs.open(path);
    await expect(docs.pageHeading, `${path} renders a page`).toBeVisible();
  }
}

/**
 * A sidebar ordered by a `pages` list with "..." in it: the entries named
 * before "..." come first in that order, the ones named after it come last,
 * and everything nav.json doesn't name sits between, in whatever order.
 */
function expectEllipsisOrder(
  sidebar: string[],
  expected: { before: string[]; unnamed: string[]; after?: string[] },
): void {
  const after = expected.after ?? [];
  expect(sidebar.slice(0, expected.before.length), "named before '...'").toEqual(expected.before);
  expect(sidebar.slice(sidebar.length - after.length), "named after '...'").toEqual(after);
  expect(
    sidebar.slice(expected.before.length, sidebar.length - after.length).sort(),
    "filled in by '...'",
  ).toEqual([...expected.unnamed].sort());
}

/** Snapshots the header (which holds the tab bar, or shows its absence) and the sidebar. */
async function snapshotNavigation(page: Page, id: string): Promise<void> {
  const docs = new DocsPage(page);
  await expect(docs.subnav).toHaveScreenshot(`${id}-header.png`, elementSnapshotOptions(page));
  await expect(docs.sidebar).toHaveScreenshot(`${id}-sidebar.png`, elementSnapshotOptions(page));
}

test.describe("nav.json — layouts that build @visual @nav", () => {
  // ---- tabs: [] and no tabs at all -------------------------------------
  //
  // The sheet orders Home's sidebar Welcome, SDKs, Context Plugin, API
  // Reference; the CLI puts the API reference first and Context Plugin before
  // SDKs. The CLI's order is the expected outcome — agreed in review of #19.

  /** Home's sidebar when nothing is a tab, on the scaffolded petstore. */
  const SECTIONS_IN_HOME = [HOME_PAGE, "API Reference", "Context Plugin", "SDKs"];

  /** No tab bar, and the three sections as folders in Home's sidebar. */
  const expectSectionsInHome = (id: string) =>
    test("no tab bar; the sections are folders in Home", async ({ page }) => {
      const docs = new DocsPage(page);
      await docs.open(routes.home);
      expect(await docs.tabLabels(), "tab bar").toEqual([]);
      expect(await docs.sidebarLabels(), "sidebar").toEqual(SECTIONS_IN_HOME);
      await snapshotNavigation(page, id);
    });

  scenario(
    "TC-01 — Empty tabs with title",
    { ...SCAFFOLD, files: nav({ title: "Home", tabs: [] }) },
    (portal) => {
      test("warns that the title shows nowhere, and nothing else", () => {
        // No "nothing is a tab" notice: [] says so on purpose.
        expect(cliWarnings(portal().cliOutput)).toEqual([TITLE_WARNING]);
      });

      expectSectionsInHome("tc-01");

      test("the sections keep their addresses, inside Home's sidebar", async ({ page }) => {
        await expectRoutesLoad(page, [routes.sdks, routes.contextPlugin, routes.apiEndpoint]);
        const docs = new DocsPage(page);
        expect(await docs.tabLabels(), "still no tab bar").toEqual([]);
        expect(await docs.sidebarLabels(), "Home's sidebar").toContain(HOME_PAGE);
      });
    },
  );

  scenario("TC-02 — Empty tabs, no title", { ...SCAFFOLD, files: nav({ tabs: [] }) }, (portal) => {
    test("no navigation warnings", () => {
      expect(cliWarnings(portal().cliOutput)).toEqual([]);
    });

    // Same layout as TC-01.
    expectSectionsInHome("tc-02");
  });

  scenario("TC-03 — No tabs key", { ...SCAFFOLD, files: nav({}) }, (portal) => {
    test("one notice, suggesting the sections in scaffold order", () => {
      expect(cliWarnings(portal().cliOutput)).toEqual([
        NO_TABS_NOTICE('["apimatic:sdks","apimatic:plugin","apimatic:api"]'),
      ]);
    });

    expectSectionsInHome("tc-03");
  });

  scenario(
    "TC-03b — No nav.json file",
    { remove: [...SCAFFOLD.remove!, "content/nav.json"] },
    (portal) => {
      test("the notice says the file is missing, and to add it", () => {
        const warnings = cliWarnings(portal().cliOutput);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(/^There is no 'content\/nav\.json'/);
        expect(warnings[0]).toContain(
          `Add the file with '"tabs": ["apimatic:sdks","apimatic:plugin","apimatic:api"]'`,
        );
      });

      expectSectionsInHome("tc-03b");
    },
  );

  // ---- sections and folders as tabs -------------------------------------

  scenario(
    "TC-04 — Sections as tabs in custom order",
    {
      ...SCAFFOLD,
      files: nav({ title: "Overview", tabs: ["apimatic:api", "apimatic:sdks", "apimatic:plugin"] }),
    },
    (portal) => {
      test("no navigation warnings", () => {
        expect(cliWarnings(portal().cliOutput)).toEqual([]);
      });

      test("tabs in the order listed; Overview holds only the home page", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect(await docs.tabLabels()).toEqual(["Overview", "API Reference", "SDKs", "Context Plugin"]);
        expect(await docs.sidebarLabels()).toEqual([HOME_PAGE]);
        await snapshotNavigation(page, "tc-04");
      });

      test("the sections keep their addresses", async ({ page }) => {
        await expectRoutesLoad(page, [routes.apiEndpoint, routes.sdks, routes.contextPlugin]);
      });
    },
  );

  scenario(
    "TC-05 — Mix of tabs, Home placement and own folders",
    { files: { ...SHEET_PAGES, ...nav(BASE_NAV) } },
    (portal) => {
      test("no navigation warnings", () => {
        expect(cliWarnings(portal().cliOutput)).toEqual([]);
      });

      test("tabs and Home's sidebar follow tabs and pages", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect(await docs.tabLabels()).toEqual(["Overview", "Tutorials", "SDKs"]);
        expectEllipsisOrder(await docs.sidebarLabels(), {
          before: [HOME_PAGE, "Guides", "Context Plugin", "Authentication"],
          // The sheet has only API Reference here; components/ and gfm/ are petstore's.
          unnamed: ["API Reference", "Components", "GFM"],
        });
        await snapshotNavigation(page, "tc-05");
      });

      test("every page keeps its address", async ({ page }) => {
        await expectRoutesLoad(page, [
          routes.guideAuthentication,
          "/tutorials/first/",
          routes.contextPlugin,
          routes.apiEndpoint,
          "/authentication/",
        ]);
      });
    },
  );

  scenario(
    "TC-10d-2 — Folder gets a page",
    {
      files: {
        ...SHEET_PAGES,
        "content/drafts/note.md": page("Draft Note"),
        ...nav({ ...BASE_NAV, tabs: ["tutorials", "drafts"] }),
      },
    },
    () => {
      test("drafts becomes a tab holding Draft Note", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open("/drafts/note/");
        expect(await docs.tabLabels()).toEqual(["Overview", "Tutorials", "Drafts"]);
        expect(await docs.sidebarLabels()).toEqual(["Draft Note"]);
        await snapshotNavigation(page, "tc-10d-2");
      });
    },
  );

  scenario(
    "TC-12h — Whitespace around entries",
    { files: { ...SHEET_PAGES, ...nav({ ...BASE_NAV, tabs: [" tutorials ", "apimatic:sdks"] }) } },
    () => {
      test("entries are trimmed", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect(await docs.tabLabels()).toEqual(["Overview", "Tutorials", "SDKs"]);
        await expect(docs.subnav).toHaveScreenshot("tc-12h-header.png", elementSnapshotOptions(page));
      });
    },
  );

  // ---- group folders -----------------------------------------------------

  scenario(
    "TC-11b — Home group folder not a tab",
    {
      remove: ["content/index.md"],
      files: {
        ...SHEET_PAGES,
        "content/(home)/index.md": page("Welcome"),
        ...nav({ ...BASE_NAV, pages: ["guides", "apimatic:plugin", "authentication", "..."] }),
      },
    },
    () => {
      test("/ still shows Welcome on the Overview tab", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        await expect(docs.pageHeading).toHaveText("Welcome");
        await expect(docs.tabLinks.first()).toHaveText("Overview");
        await expect(docs.tabLinks.first()).toHaveAttribute("aria-current", "page");
        await snapshotNavigation(page, "tc-11b");
      });
    },
  );

  scenario(
    "TC-11c — Group folder without index as tab",
    {
      files: {
        // authentication.md goes in the group folder instead of at the root.
        "content/tutorials/first.md": SHEET_PAGES["content/tutorials/first.md"],
        "content/(extras)/authentication.md": page("Authentication"),
        ...nav({
          ...BASE_NAV,
          tabs: ["(extras)", "tutorials"],
          pages: ["index", "guides", "apimatic:plugin", "..."],
        }),
      },
    },
    () => {
      test("(extras) is a tab, and /authentication keeps its address", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open("/authentication/");
        await expect(docs.pageHeading).toHaveText("Authentication");
        // The sheet asks to note the label rather than naming one. It reads
        // "Extras": the parentheses are dropped and the name capitalised.
        expect(await docs.tabLabels()).toEqual(["Overview", "Extras", "Tutorials"]);
        await expect(docs.subnav).toHaveScreenshot("tc-11c-header.png", elementSnapshotOptions(page));
      });
    },
  );

  // ---- a page and a folder with the same name -------------------------

  scenario(
    "TC-16c-2 — Page/folder clash not positioned",
    {
      files: {
        ...SHEET_PAGES,
        "content/folder.md": page("Folder Page"),
        "content/folder/fold.md": page("Fold"),
        ...nav(BASE_NAV),
      },
    },
    () => {
      test("both are in Home, the page first", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        // The sheet fixes only their relative order; where "..." puts them
        // among the other unnamed nodes is the snapshot's to record.
        const sidebar = await docs.sidebarLabels();
        expect(sidebar, "Folder Page in Home").toContain("Folder Page");
        expect(sidebar, "Folder in Home").toContain("Folder");
        expect(sidebar.indexOf("Folder Page"), "page before folder").toBeLessThan(
          sidebar.indexOf("Folder"),
        );
        await expect(docs.sidebar).toHaveScreenshot("tc-16c-2-sidebar.png", elementSnapshotOptions(page));
      });

      test("/folder and /folder/fold resolve", async ({ page }) => {
        await expectRoutesLoad(page, ["/folder/", "/folder/fold/"]);
      });
    },
  );

  scenario(
    "TC-16c-3 — Page/folder clash in tabs",
    {
      files: {
        ...SHEET_PAGES,
        "content/folder.md": page("Folder Page"),
        "content/folder/fold.md": page("Fold"),
        ...nav({ ...BASE_NAV, tabs: ["folder", "apimatic:api"] }),
      },
    },
    () => {
      test("the folder is the tab; the page stays in Home", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect(await docs.tabLabels()).toEqual(["Overview", "Folder", "API Reference"]);
        expect(await docs.sidebarLabels()).toContain("Folder Page");
        await snapshotNavigation(page, "tc-16c-3");
      });
    },
  );

  // ---- a folder named by its index page or its own title ----------------

  const folderWithIndex = {
    ...SHEET_PAGES,
    "content/folder/index.md": page("Folder Home"),
    "content/folder/fold.md": page("Fold"),
    ...nav({ ...BASE_NAV, tabs: ["folder", "apimatic:api"] }),
  };

  scenario(
    "TC-16d-2 — Folder named by index title",
    { files: { ...folderWithIndex, ...nav({ pages: ["fold"] }, "content/folder/nav.json") } },
    () => {
      test("the tab takes the index page's title, and /folder opens it", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open("/folder/");
        await expect(docs.pageHeading).toHaveText("Folder Home");
        expect(await docs.tabLabels()).toEqual(["Overview", "Folder Home", "API Reference"]);
        await expect(docs.subnav).toHaveScreenshot("tc-16d-2-header.png", elementSnapshotOptions(page));
      });
    },
  );

  scenario(
    "TC-16d-3 — title outranks index title",
    {
      files: {
        ...folderWithIndex,
        ...nav({ title: "Docs", pages: ["fold"] }, "content/folder/nav.json"),
      },
    },
    () => {
      test("the tab reads the folder's title", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open("/folder/");
        expect(await docs.tabLabels()).toEqual(["Overview", "Docs", "API Reference"]);
        await expect(docs.subnav).toHaveScreenshot("tc-16d-3-header.png", elementSnapshotOptions(page));
      });
    },
  );

  // ---- ordering Home's sidebar with pages -------------------------------

  scenario(
    'TC-13a — "..." in the middle, API first',
    {
      files: {
        ...SHEET_PAGES,
        ...nav({ ...BASE_NAV, pages: ["apimatic:api", "index", "...", "authentication"] }),
      },
    },
    (portal) => {
      test("no navigation warnings", () => {
        expect(cliWarnings(portal().cliOutput)).toEqual([]);
      });

      test('the unnamed nodes fill in where "..." sits', async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect(await docs.tabLabels()).toEqual(["Overview", "Tutorials", "SDKs"]);
        expectEllipsisOrder(await docs.sidebarLabels(), {
          before: ["API Reference", HOME_PAGE],
          unnamed: ["Components", "Context Plugin", "GFM", "Guides"],
          after: ["Authentication"],
        });
        // Home opens on index wherever it sits in the list.
        await expect(docs.pageHeading).toHaveText(HOME_PAGE);
        await snapshotNavigation(page, "tc-13a");
      });
    },
  );

  scenario(
    'TC-13b — No "..." in pages',
    { files: { ...SHEET_PAGES, ...nav({ ...BASE_NAV, pages: ["index", "authentication"] }) } },
    (portal) => {
      test("no warning", () => {
        expect(cliWarnings(portal().cliOutput)).toEqual([]);
      });

      test("unnamed nodes aren't hidden; they follow the named ones", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        const sidebar = await docs.sidebarLabels();
        expectEllipsisOrder(sidebar, {
          before: [HOME_PAGE, "Authentication"],
          unnamed: ["API Reference", "Components", "Context Plugin", "GFM", "Guides"],
        });
        // The sheet has API Reference last; the CLI puts it straight after the
        // named entries. The CLI's order is the expected outcome — agreed in
        // review of #19. The rest are petstore's, recorded by the snapshot.
        expect(sidebar[2], "first unnamed entry").toBe("API Reference");
        await snapshotNavigation(page, "tc-13b");
      });
    },
  );

  scenario(
    'TC-13c — "api" alias in pages',
    { files: { ...SHEET_PAGES, ...nav({ ...BASE_NAV, pages: ["index", "api", "..."] }) } },
    () => {
      test("api places the API reference just as apimatic:api does", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect((await docs.sidebarLabels()).slice(0, 2)).toEqual([HOME_PAGE, "API Reference"]);
        await expect(docs.sidebar).toHaveScreenshot("tc-13c-sidebar.png", elementSnapshotOptions(page));
      });
    },
  );

  // ---- upgrading a nav.json written before tabs --------------------------

  scenario(
    "TC-14a — Upgrade: pages only, no tabs",
    {
      files: {
        ...SHEET_PAGES,
        "content/folder/fold.md": page("Fold"),
        ...nav({
          title: "Overview",
          pages: ["index", "folder", "apimatic:plugin", "authentication", "..."],
        }),
      },
    },
    (portal) => {
      test("the notice suggests only the sections pages doesn't place; title warns too", () => {
        const warnings = cliWarnings(portal().cliOutput);
        expect(warnings).toHaveLength(2);
        const notice = warnings.find((w) => w.includes("has no 'tabs'"));
        expect(notice, "the no-tabs notice").toBeDefined();
        expect(notice).toContain(`'"tabs": ["apimatic:sdks","apimatic:api"]'`);
        // pages already places the plugin, and own folders are never suggested.
        expect(notice).not.toContain("apimatic:plugin");
        // \b on both sides: the notice's own wording says "folders".
        expect(notice).not.toMatch(/\bfolder\b|tutorials|guides|components|gfm/i);
        expect(warnings).toContain(TITLE_WARNING);
      });

      test("no tab bar", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect(await docs.tabLabels()).toEqual([]);
        await snapshotNavigation(page, "tc-14a");
      });
    },
  );

  // ---- tabs that read alike ---------------------------------------------

  const caseClash = {
    ...SHEET_PAGES,
    "content/folder/fold.md": page("Fold"),
    "content/api-reference/overview.md": page("Overview Guide"),
    ...nav({
      title: "Overview",
      tabs: ["folder", "api-reference", "apimatic:api"],
      pages: ["index", "authentication", "..."],
    }),
  };

  scenario("TC-15a — Tab names differing only by case", { files: caseClash }, (portal) => {
    test("builds, with a warning naming both tabs", () => {
      const warnings = cliWarnings(portal().cliOutput);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatch(/^More than one tab has the same name, or one that differs only in case/);
      expect(warnings[0]).toContain("Api reference");
      expect(warnings[0]).toContain("API Reference");
    });

    test("both tabs are drawn", async ({ page }) => {
      const docs = new DocsPage(page);
      await docs.open(routes.home);
      expect(await docs.tabLabels()).toEqual(["Overview", "Folder", "Api reference", "API Reference"]);
      await expect(docs.subnav).toHaveScreenshot("tc-15a-header.png", elementSnapshotOptions(page));
    });
  });

  const renamed = {
    ...caseClash,
    ...nav({ title: "Reference Guides" }, "content/api-reference/nav.json"),
  };

  scenario("TC-15b — Fix with folder title", { files: renamed }, (portal) => {
    test("the warning is gone", () => {
      expect(cliWarnings(portal().cliOutput)).toEqual([]);
    });

    test("the third tab reads the folder's title", async ({ page }) => {
      const docs = new DocsPage(page);
      await docs.open(routes.home);
      expect(await docs.tabLabels()).toEqual(["Overview", "Folder", "Reference Guides", "API Reference"]);
      await expect(docs.subnav).toHaveScreenshot("tc-15b-header.png", elementSnapshotOptions(page));
    });
  });

  scenario(
    "TC-15c — Home title collides with folder tab",
    {
      files: {
        ...renamed,
        ...nav({
          title: "folder",
          tabs: ["folder", "api-reference", "apimatic:api"],
          pages: ["index", "authentication", "..."],
        }),
      },
    },
    (portal) => {
      test("the warning names the Home tab and the folder's tab", () => {
        const warnings = cliWarnings(portal().cliOutput);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(/^More than one tab has the same name/);
        expect(warnings[0]).toContain("folder");
        expect(warnings[0]).toContain("Folder");
      });

      test("both tabs are drawn", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect((await docs.tabLabels()).slice(0, 2)).toEqual(["folder", "Folder"]);
        await expect(docs.subnav).toHaveScreenshot("tc-15c-header.png", elementSnapshotOptions(page));
      });
    },
  );

  // ---- no plugin block --------------------------------------------------

  const withoutPlugin: ScenarioChanges["config"] = (config) => {
    delete config.plugin;
  };

  scenario(
    "TC-18a — apimatic:plugin with no plugin block",
    {
      config: withoutPlugin,
      files: {
        ...SHEET_PAGES,
        "content/folder/fold.md": page("Fold"),
        ...nav({
          title: "Overview",
          tabs: ["folder", "apimatic:plugin", "apimatic:sdks"],
          pages: ["index", "authentication", "..."],
        }),
      },
    },
    (portal) => {
      test("no error or warning", () => {
        expect(cliWarnings(portal().cliOutput)).toEqual([]);
      });

      test("the plugin tab is left out", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open(routes.home);
        expect(await docs.tabLabels()).toEqual(["Overview", "Folder", "SDKs"]);
        await expect(docs.subnav).toHaveScreenshot("tc-18a-header.png", elementSnapshotOptions(page));
      });

      test("/context-plugin is a 404", async ({ request }) => {
        const response = await request.get(routes.contextPlugin);
        expect(response.status()).toBe(404);
      });
    },
  );

  scenario(
    "TC-18b — No-tabs notice without plugin",
    {
      config: withoutPlugin,
      files: {
        ...SHEET_PAGES,
        "content/folder/fold.md": page("Fold"),
        ...nav({ title: "Overview", pages: ["index", "authentication", "..."] }),
      },
    },
    (portal) => {
      test("the notice suggests only SDKs and the API reference", () => {
        const notice = cliWarnings(portal().cliOutput).find((w) => w.includes("has no 'tabs'"));
        expect(notice, "the no-tabs notice").toBeDefined();
        expect(notice).toContain(`'"tabs": ["apimatic:sdks","apimatic:api"]'`);
        expect(notice).not.toMatch(/Context Plugin|apimatic:plugin/);
      });
    },
  );

  // ---- subfolders ordering their own pages ------------------------------

  const nested: Record<string, string> = {
    "content/folder/fold.md": page("Fold"),
    "content/folder/setup.md": page("Setup"),
    "content/folder/zeta.md": page("Zeta"),
    "content/folder/advanced/intro.md": page("Intro"),
    "content/folder/advanced/tuning.md": page("Tuning"),
    ...nav({ title: "Docs", pages: ["setup", "advanced", "...", "fold"] }, "content/folder/nav.json"),
    ...nav({ title: "Advanced Topics", pages: ["tuning", "intro"] }, "content/folder/advanced/nav.json"),
  };

  scenario(
    "TC-N1 — Subfolder ordering at two levels",
    { files: { ...nested, ...nav({ title: "Home", tabs: ["folder"] }) } },
    (portal) => {
      test("no warnings", () => {
        expect(cliWarnings(portal().cliOutput)).toEqual([]);
      });

      test("each folder's nav.json orders its own pages", async ({ page }) => {
        const docs = new DocsPage(page);
        // Opened on a page inside advanced/, so that folder is expanded.
        await docs.open("/folder/advanced/tuning/");
        expect(await docs.tabLabels()).toEqual(["Home", "Docs"]);
        expect(await docs.sidebarLabels()).toEqual([
          "Setup",
          "Advanced Topics",
          "Tuning",
          "Intro",
          "Zeta",
          "Fold",
        ]);
        await snapshotNavigation(page, "tc-n1");
      });

      test("addresses follow the folder paths", async ({ page }) => {
        await expectRoutesLoad(page, [
          "/folder/setup/",
          "/folder/advanced/tuning/",
          "/folder/advanced/intro/",
          "/folder/zeta/",
          "/folder/fold/",
        ]);
      });
    },
  );

  scenario(
    "TC-N2 — Subfolder placed in Home",
    { files: { ...nested, ...nav({ tabs: [] }) } },
    () => {
      test("the folder keeps its order, as a group in Home", async ({ page }) => {
        const docs = new DocsPage(page);
        await docs.open("/folder/advanced/tuning/");
        expect(await docs.tabLabels(), "no tab bar").toEqual([]);

        const sidebar = await docs.sidebarLabels();
        const start = sidebar.indexOf("Docs");
        expect(start, `"Docs" group in ${JSON.stringify(sidebar)}`).toBeGreaterThanOrEqual(0);
        expect(sidebar.slice(start, start + 7)).toEqual([
          "Docs",
          "Setup",
          "Advanced Topics",
          "Tuning",
          "Intro",
          "Zeta",
          "Fold",
        ]);
        await expect(docs.sidebar).toHaveScreenshot("tc-n2-sidebar.png", elementSnapshotOptions(page));
      });
    },
  );
});
