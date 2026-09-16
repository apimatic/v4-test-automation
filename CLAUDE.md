# dxV2 Test Automation — Project Conventions

Visual and functional tests for dx-portal V2 (apimatic/apimatic-dx-portal-v2).
See README.md for setup and how the portal gets built and served.

## Tech Stack
- **Playwright** with TypeScript, ESM (`"type": "module"` — internal imports need
  explicit `.ts` extensions)
- **Page Object Model (POM)**, following the conventions of the V1
  `platform-test-automation` repo
- **dotenv** for local config

## Self-contained by design
This repo is the one that goes to GitHub and takes all future changes, so it
must stand on its own: no machine-specific paths in committed config, and
`pnpm install && pnpm setup:portal && pnpm test:visual` works on a fresh clone.

The portal app can't be a dependency — `apps/docs` is `"private": true`, no image
is published, and `generate-docs` lives in its source. So `pnpm setup:portal`
clones it into `.portal/` (gitignored) at the commit pinned in
`config/portal-source.json`. **Don't reintroduce a required `PORTAL_REPO`** —
it's an optional override for people hacking on the portal itself.

## Project Structure
```
config/portals.ts    → registry of portal builds + their routes
config/portal-source.json → the portal app + the pinned commit
test-builds/         → the build fixtures the portals are generated from
utils/env.ts         → reads .env; resolves portal repo / build / baseURL
utils/visual.ts      → snapshot stability helpers
pages/               → Page Object classes (locators + actions)
tests/visual/<build>/ → visual specs, one folder per portal build
tests/functional/<build>/ → functional specs, one folder per portal build
scripts/             → setup-portal.mts (clone the pinned portal app)
                       serve-portal.mts (generate + dev inside it)
.portal/             → the portal app, gitignored, managed by setup:portal
dxv2-portal-snapshots/ → committed baselines
```

## Coding Conventions

### Page Objects (`pages/`)
- Every page class extends `BasePage`, which holds the `page` instance
- **All locators are class properties** set in the constructor — never inline a
  locator in a test file
- **All interactions are methods** on the page class (`openSearch()`,
  `toggleColorMode()`, `collapseSidebar()`)
- Prefer the portal's own stable ids (`#nd-portal-header`, `#nd-sidebar`,
  `#nd-page`, `#fd-search-dialog-content`) and roles/labels. **Never key off a
  Tailwind utility class** — those churn on every restyle
- Verification methods return `Promise<boolean>` and `waitFor` before returning
- Methods that wait for a UI state change should wait on the app's own signal
  (e.g. the collapse button's label flipping to "Expand sidebar"), not a
  `waitForTimeout`

### Routes and builds (`config/portals.ts`, `test-builds/`)
- Tests never hardcode a URL slug — they read named routes off `portalConfig()`
- Adding a portal build = copy it into `test-builds/`, add an entry here, add a
  folder under `tests/visual/`
- Build fixtures are vendored on purpose, so a snapshot failure always means the
  portal changed. **Editing a file under `test-builds/` is editing a fixture** —
  it will move baselines. See `test-builds/README.md`

### Visual tests (`tests/visual/`)
- One file per portal build, in a folder named after the build. The snapshot path
  template keys off the test's folder, so baselines group themselves
- Always go through `snapshotOptions(page)` — it sets `maxDiffPixelRatio`,
  disables animations and hides the caret consistently
- Pair a screenshot with at least one real assertion where you can
  (`await expect(docs.searchDialog).toBeVisible()`). A screenshot alone can pass
  on a page that rendered the wrong thing but rendered it stably
- Prefer element-scoped snapshots (`expect(docs.header).toHaveScreenshot()`) for
  chrome, so page-content changes don't fail them
- If a snapshot starts failing on churn rather than a real change, add the
  selector to `dynamicRegions()` in `utils/visual.ts` **with a comment saying
  what churns** — don't widen `maxDiffPixelRatio`

### Before adding a locator
The portal has no `data-testid` attributes, and its header renders several
responsive variants of the same control with all but one hidden. **Verify a
locator against the running portal before committing a test that depends on it** —
`page.getByRole(...)` skips elements that aren't in the accessibility tree, so a
control you can see in the DOM may resolve to zero matches.

### Visual or functional?
- **Visual** for anything whose value is how it looks: layout, theming, a
  rendered table, a populated overlay, a responsive breakpoint
- **Functional** for anything whose value is what it does: navigation
  destinations, search actually matching, a language tab changing the sample,
  state surviving a reload, an HTTP route still serving
- A screenshot of a link proves it rendered, never that it goes anywhere. When
  both matter, write both — they share page objects and the route registry

### Functional tests (`tests/functional/`)
- Same page-object rule as the visual suite: no raw locators in test files
- Assert the destination, not merely that something happened
  (`expect(heading).toHaveText("ApiResponse")`, not just a URL change)
- Use the `request` fixture for the machine-facing routes (`llms.txt`,
  `/api/search`, `/static/**`) — no browser needed, and they're the parts that
  rot silently because nothing on screen changes when they break
- Wait on the app's own signal, never a fixed delay. Where a page satisfies the
  ready check both before and after a navigation, wait for the URL to change
  first — otherwise the assertion reads the old page

## When Writing New Tests
1. Add the route to `config/portals.ts` if it isn't there
2. Add any new locators and actions to `pages/DocsPage.ts`
3. Write the test using only page class methods and named routes
4. Run it, look at the resulting PNG, and confirm it shows what you meant
5. Run it a second time to confirm it's stable before committing the baseline
