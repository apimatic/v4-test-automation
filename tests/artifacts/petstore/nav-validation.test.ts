import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { refusedScenario, type ScenarioChanges } from "../../../utils/scenario.ts";
import { BASE_NAV, NAV_BUILD, SHEET_PAGES, nav, page } from "../../../utils/nav.ts";

/**
 * Stage 1 for nav.json: the layouts `apimatic portal generate` must refuse.
 *
 * Every case here is a row of the nav.json sheet in the QA RTM (issue #7)
 * whose expected outcome is "Build refused with exactly one error". There's no
 * portal to look at, so nothing here opens a browser — each case runs the CLI
 * on an edited copy of the petstore build, with the sheet's pages added (see
 * SHEET_PAGES), and checks what it printed. The layouts that build are in
 * tests/visual/petstore/nav.visual.test.ts.
 *
 * A refused build stops before anything is generated, so a case takes a few
 * seconds and gets a CLI run of its own rather than sharing one.
 *
 * Expected messages are the sheet's, with one difference: the sheet names the
 * file `src/content/nav.json`, and the CLI names it relative to `src/`, as
 * `content/nav.json`.
 */

type RefusedCase = {
  /** The sheet's TC id and scenario name. */
  title: string;
  changes: ScenarioChanges;
  /**
   * Every error the CLI should print, in order. A RegExp where the sheet
   * elides part of the message.
   */
  errors: Array<string | RegExp>;
};

const cases: RefusedCase[] = [
  {
    title: 'TC-06 — "..." in tabs',
    changes: { files: nav({ ...BASE_NAV, tabs: ["tutorials", "apimatic:sdks", "..."] }) },
    errors: [
      "content/nav.json: '...' cannot be a tab, since it would make a tab of every folder 'tabs' does not name. Name the folders meant as tabs; the rest stay in Home.",
    ],
  },
  {
    title: "TC-07 — A page in tabs",
    changes: {
      files: nav({
        ...BASE_NAV,
        tabs: ["tutorials", "authentication"],
        pages: ["index", "guides", "apimatic:plugin", "..."],
      }),
    },
    errors: [
      "content/nav.json: 'authentication' is a page, and a tab is a folder. Order it in Home's sidebar with 'pages' instead.",
    ],
  },
  {
    title: "TC-08a — Wrong case in tabs",
    changes: { files: nav({ ...BASE_NAV, tabs: ["Tutorials", "apimatic:sdks"] }) },
    errors: [
      "content/nav.json: 'Tutorials' is not a folder in this directory. Did you mean 'tutorials'?",
    ],
  },
  {
    title: "TC-08b — Typo in tabs",
    changes: { files: nav({ ...BASE_NAV, tabs: ["tutorial", "apimatic:sdks"] }) },
    // Exact, so a suggestion tacked on the end fails it: matching is case-only.
    errors: ["content/nav.json: 'tutorial' is not a folder in this directory."],
  },
  {
    title: "TC-08c — Section folder name instead of token",
    changes: { files: nav({ ...BASE_NAV, tabs: ["tutorials", "sdks"] }) },
    errors: [
      /^content\/nav\.json: 'sdks' is not a folder in this directory\. 'apimatic:sdks' makes .+ a tab\.$/,
    ],
  },
  {
    title: "TC-09a — Same folder twice in tabs",
    changes: { files: nav({ ...BASE_NAV, tabs: ["tutorials", "apimatic:sdks", "tutorials"] }) },
    errors: ["content/nav.json: 'tutorials' is listed more than once."],
  },
  // TC-09b and TC-09d: the CLI names the two lists the other way round from
  // the sheet ('pages' before 'tabs'). The CLI's wording is the expected
  // outcome — agreed in review of #19.
  {
    title: "TC-09b — Folder in both tabs and pages",
    changes: {
      files: nav({
        ...BASE_NAV,
        pages: ["index", "tutorials", "guides", "apimatic:plugin", "authentication", "..."],
      }),
    },
    errors: [
      "content/nav.json: 'tutorials' is in both 'pages' and 'tabs', and a node is either a tab or in Home's sidebar. Keep one of them.",
    ],
  },
  {
    title: "TC-09d — API reference split across lists",
    changes: {
      files: nav({
        ...BASE_NAV,
        tabs: ["tutorials", "apimatic:sdks", "api"],
        pages: ["index", "guides", "apimatic:plugin", "authentication", "apimatic:api", "..."],
      }),
    },
    errors: [
      "content/nav.json: 'apimatic:api' in 'pages' and 'api' in 'tabs' both position the API reference, and a node is either a tab or in Home's sidebar. Keep one of them.",
    ],
  },
  {
    title: "TC-09c — API reference under both names in tabs",
    changes: {
      files: nav({ ...BASE_NAV, tabs: ["tutorials", "apimatic:sdks", "api", "apimatic:api"] }),
    },
    errors: [
      "content/nav.json: 'api' and 'apimatic:api' both position the API reference; keep one of them.",
    ],
  },
  {
    title: "TC-10a — Path in tabs",
    changes: { files: nav({ ...BASE_NAV, tabs: ["tutorials", "guides/authentication"] }) },
    errors: [
      "content/nav.json: 'guides/authentication' addresses another directory. A tab is a folder directly under the content directory.",
    ],
  },
  {
    title: "TC-10a — Path in tabs, Windows separator",
    changes: { files: nav({ ...BASE_NAV, tabs: ["tutorials", "guides\\authentication"] }) },
    errors: [
      "content/nav.json: 'guides\\authentication' addresses another directory. A tab is a folder directly under the content directory.",
    ],
  },
  {
    title: "TC-10b — Path in pages",
    changes: {
      files: nav({
        ...BASE_NAV,
        pages: ["index", "guides/authentication", "apimatic:plugin", "authentication", "..."],
      }),
    },
    errors: [
      "content/nav.json: 'guides/authentication' addresses another directory. An entry names a page or folder in this directory; order a subfolder's pages with its own nav.json.",
    ],
  },
  {
    title: "TC-10c — Empty entry in tabs",
    changes: { files: nav({ ...BASE_NAV, tabs: ["tutorials", ""] }) },
    errors: ["content/nav.json: 'tabs' must not contain an empty entry."],
  },
  {
    title: "TC-10d — Folder with no pages as tab",
    changes: {
      dirs: ["content/drafts"],
      files: nav({ ...BASE_NAV, tabs: ["tutorials", "drafts"] }),
    },
    // Not "is not a folder": the folder exists, it just has nothing in it.
    errors: [
      "content/nav.json: 'drafts' is a folder with no page in it or below it, so it is not in the sidebar. Add a page to it, or remove the entry.",
    ],
  },
  {
    title: "TC-11 — Group folder serving home page as tab",
    changes: {
      remove: ["content/index.md"],
      files: {
        "content/(home)/index.md": page("Welcome"),
        ...nav({
          ...BASE_NAV,
          tabs: ["(home)", "tutorials", "apimatic:sdks"],
          pages: ["guides", "apimatic:plugin", "authentication", "..."],
        }),
      },
    },
    errors: [
      "content/nav.json: '(home)' serves the home page, which belongs to the Home tab, so it cannot be a tab of its own. Remove the entry, or move the page out of the folder.",
    ],
  },
  {
    title: "TC-12a — title not a string",
    changes: { files: nav({ ...BASE_NAV, title: 123 }) },
    errors: ["content/nav.json: 'title' must be a non-empty string."],
  },
  {
    title: "TC-12b — title only spaces",
    changes: { files: nav({ ...BASE_NAV, title: " " }) },
    errors: ["content/nav.json: 'title' must be a non-empty string."],
  },
  {
    title: "TC-12c — tabs not an array (all errors reported at once)",
    changes: {
      files: nav({
        ...BASE_NAV,
        tabs: "tutorials",
        pages: ["index", "guides/authentication", "apimatic:plugin", "authentication", "..."],
      }),
    },
    // Two unrelated mistakes, both reported — not just the first one found.
    errors: [
      "content/nav.json: 'tabs' must be an array of strings.",
      /^content\/nav\.json: 'guides\/authentication' addresses another directory\. /,
    ],
  },
  {
    title: "TC-12d — Non-string in tabs",
    changes: { files: nav({ ...BASE_NAV, tabs: ["tutorials", 5] }) },
    errors: ["content/nav.json: 'tabs' must be an array of strings."],
  },
  {
    title: "TC-12e — Unknown setting",
    changes: {
      files: nav({ title: BASE_NAV.title, tab: ["tutorials"], pages: BASE_NAV.pages }),
    },
    errors: [
      "content/nav.json: 'tab' is not a nav.json setting. The settings are 'pages', 'title' and 'tabs'.",
    ],
  },
  {
    title: "TC-12f — tabs in a subfolder nav.json",
    changes: { files: nav({ tabs: ["authentication"] }, "content/guides/nav.json") },
    errors: [
      "content/guides/nav.json: 'tabs' is only read in the nav.json at the top of the content directory, where the tabs are decided. Remove it here; this file orders its own folder with 'pages'.",
    ],
  },
  {
    title: "TC-12g — title in a folder with no pages",
    changes: { files: nav({ title: "Drafts" }, "content/drafts/nav.json") },
    errors: [
      "content/drafts/nav.json: 'title' names this folder, but a directory with no page in it or below it is no folder in the sidebar. Add a page, or remove the setting.",
    ],
  },
  {
    title: "TC-16a — Token in a subfolder nav.json",
    changes: {
      files: {
        "content/folder/fold.md": page("Fold"),
        ...nav({ pages: ["fold", "apimatic:sdks"] }, "content/folder/nav.json"),
      },
    },
    errors: [
      "content/folder/nav.json: 'apimatic:sdks' can only be used in the nav.json at the top of the content directory, because that is where the node it positions lives. List it in that file's 'tabs' to make it a tab, or in its 'pages' to place it in Home.",
    ],
  },
  {
    title: "TC-16b — Unknown token",
    changes: {
      files: {
        "content/folder/fold.md": page("Fold"),
        ...nav({ ...BASE_NAV, tabs: ["folder", "apimatic:docs", "apimatic:api"] }),
      },
    },
    // Not "is not a folder": anything starting apimatic: is read as a token.
    errors: [
      "content/nav.json: 'apimatic:docs' is not a nav.json token. The tokens are 'apimatic:sdks', 'apimatic:plugin' and 'apimatic:api'.",
    ],
  },
  {
    title: "TC-16c — Page and folder with same name in pages",
    changes: {
      files: {
        "content/folder.md": page("Folder Page"),
        "content/folder/fold.md": page("Fold"),
        ...nav({ ...BASE_NAV, pages: ["index", "folder", "authentication", "..."] }),
      },
    },
    errors: [
      "content/nav.json: 'folder' is both a page and a folder in this directory, and the entry positions the folder. Rename the page to position it.",
    ],
  },
  {
    title: "TC-16d — index in a subfolder pages",
    changes: {
      files: {
        "content/folder/index.md": page("Folder Home"),
        "content/folder/fold.md": page("Fold"),
        ...nav({ pages: ["index", "fold"] }, "content/folder/nav.json"),
      },
    },
    errors: [
      "content/folder/nav.json: 'index' is the page this folder opens on, so it cannot be positioned among its pages. Remove the entry; the folder itself is positioned by the nav.json one level up.",
    ],
  },
];

test.describe("nav.json — layouts the CLI refuses @artifacts @nav", () => {
  for (const c of cases) {
    test(c.title, async () => {
      // The sheet's pages first, so a case's own files can override them.
      const changes = { ...c.changes, files: { ...SHEET_PAGES, ...c.changes.files } };
      const run = await refusedScenario(c.title, changes, { build: NAV_BUILD });
      try {
        expect(run.exitCode, `exit code — CLI output:\n${run.output}`).not.toBe(0);
        // A refused build writes nothing.
        expect(fs.existsSync(path.join(run.root, "portal")), "portal/ written").toBe(false);

        // Exactly these errors. Comparing the whole list, rather than looking
        // for the expected one, is what catches a second, spurious error.
        expect(run.errors, `errors — CLI output:\n${run.output}`).toHaveLength(c.errors.length);
        c.errors.forEach((expected, i) => {
          if (typeof expected === "string") expect(run.errors[i]).toBe(expected);
          else expect(run.errors[i]).toMatch(expected);
        });
      } finally {
        run.cleanup();
      }
    });
  }

  test("TC-G1 — Validation error stops portal generate", async () => {
    // A build that generated fine last time, then broke. The refusal must
    // leave the last good portal where it was.
    const previous = "<!-- the previous build -->";
    const run = await refusedScenario(
      "TC-G1",
      {
        // Petstore has no tutorials/ and the sheet's pages aren't added here,
        // so 'tutorials' names a folder that isn't there.
        files: {
          "content/folder/fold.md": page("Fold"),
          ...nav({ title: "Home", tabs: ["folder", "tutorials"] }),
        },
      },
      {
        build: NAV_BUILD,
        before: (root) => {
          fs.mkdirSync(path.join(root, "portal"));
          fs.writeFileSync(path.join(root, "portal", "index.html"), previous);
        },
      },
    );
    try {
      expect(run.exitCode, `exit code — CLI output:\n${run.output}`).not.toBe(0);
      expect(run.errors).toEqual(["content/nav.json: 'tutorials' is not a folder in this directory."]);
      expect(fs.readdirSync(path.join(run.root, "portal")), "portal/ contents").toEqual(["index.html"]);
      expect(fs.readFileSync(path.join(run.root, "portal", "index.html"), "utf-8")).toBe(previous);
    } finally {
      run.cleanup();
    }
  });
});
