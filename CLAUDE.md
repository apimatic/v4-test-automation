# v4 Test Automation — Project Conventions

Tests for APIMatic v4 portals — the static bundles `apimatic portal generate`
produces. See README.md for the pipeline and how to run it.

## Tech Stack
- **Playwright** with TypeScript, ESM (`"type": "module"` — internal imports
  need explicit `.ts` extensions)
- **Page Object Model (POM)**
- **APIMatic CLI** for generation, **http-server** for serving
- **dotenv** for local config

## The three stages
The repo is ordered by when things happen, and each stage catches what the next
one can't:

1. **artifacts** — each scenario copies `src/` to a temp folder, changes it,
   generates, and checks the bundle against the copy's `apimatic.json`.
   Filesystem only, no browser, no server. A portal built wrong is not worth screenshotting.
2. **visual** — how the served portal looks, against committed baselines.
3. **functional** — what it does. Structure in place, cases still to come.

Don't put a filesystem check in the browser suites, and don't screenshot
something whose value is behavioural.

## Self-contained by design
Everything resolves inside this repo: the build fixture, the generated output,
the baselines. There is no portal app to clone, pin, install or patch — v4 is a
static bundle, so `apimatic portal generate` plus `http-server` is the whole
toolchain. **Don't reintroduce a required path to anything outside the repo.**

## Project Structure
```
config/portals.ts          → registry of builds + their named routes
test-builds/<name>/src/    → build input: apimatic.json, content/, spec/, static/
test-builds/<name>/portal/ → generated output, gitignored, rebuilt every run
utils/env.ts               → build dir, generated dir, port, baseURL
utils/scenario.ts          → copy src/ to temp, apply changes, generate
utils/artifacts.ts         → declared-vs-produced helpers, zip manifest reading
utils/visual.ts            → snapshot stability helpers
pages/                     → Page Object classes (locators + actions)
tests/artifacts/<build>/   → stage 1
tests/visual/<build>/      → stage 2
tests/functional/          → stage 3
scripts/serve-portal.mts   → generate + serve
portal-snapshots/          → committed visual baselines
```

## Coding Conventions

### Page Objects (`pages/`)
- Every page class extends `BasePage`, which holds the `page` instance
- **All locators are class properties** set in the constructor — never inline a
  locator in a test file
- **All interactions are methods** on the page class
- Prefer the portal's own stable hooks — `#nd-subnav`, `#nd-sidebar`,
  `#nd-page`, `#fd-search-list`, `[data-theme-toggle]` — and roles/labels.
  **Never key off a Tailwind utility class**; those churn on every restyle
- Note what the v4 chrome does differently: the search overlay's dialog carries
  a generated Radix id (match it by role), search rows are
  `button[role="option"]` rather than links, and the theme control is one
  button holding two decorative icons — clicking the button itself does nothing

### Routes and builds (`config/portals.ts`, `test-builds/`)
- Tests never hardcode a URL — they read named routes off `portalConfig()`
- Adding a build = drop it in `test-builds/`, add an entry here, add spec
  folders under each stage you want to cover
- Build fixtures are vendored on purpose, so a failure means the generator
  changed, never that someone edited a build out from under us
- A route that exists but doesn't work belongs out of the registry with a
  comment saying why, not in it and failing

### Artifact tests (`tests/artifacts/`)
- Every scenario goes through `generateScenario()` — never edit the committed
  build, and never read the shared `test-builds/<name>/portal/` output
- One `test.describe` per scenario: generate in `beforeAll`, `cleanup()` in
  `afterAll`, and put every check on that output inside it. Each generation is
  a real CLI run (~35s), so don't generate per test
- Read the declared side off `portal.config()` — the scenario's edited copy —
  not the committed `apimatic.json`
- Compare against what `apimatic.json` **declares**, never against hardcoded
  expected values — the config is the contract, and a test that restates it
  will pass when both drift together
- Collect mismatches and assert once, so a run reports every problem rather
  than stopping at the first
- Distinguish "wrong value" from "value absent entirely" in the message; they
  are different defects
- Skip rather than fail when a block isn't declared at all — a build that omits
  `packageConfiguration` is entitled to the generator's defaults

### Visual tests (`tests/visual/`)
- Always go through `snapshotOptions(page)` — consistent `maxDiffPixelRatio`,
  animations disabled, caret hidden
- Pair a screenshot with at least one real assertion. A screenshot alone can
  pass on a page that rendered the wrong thing but rendered it stably
- Prefer element-scoped snapshots for chrome, so page-content changes don't
  fail them
- If a snapshot starts failing on churn rather than a real change, add the
  selector to `dynamicRegions()` in `utils/visual.ts` **with a comment saying
  what churns** — don't widen the tolerance

### Before adding a locator
The portal has no `data-testid` attributes and renders responsive variants of
the same control with all but one hidden. **Verify a locator against the
running portal before committing a test that depends on it** — `getByRole` skips
elements that aren't in the accessibility tree, so a control you can see in the
DOM may resolve to zero matches.

## When Writing New Tests
1. Add the route to `config/portals.ts` if it isn't there
2. Add any new locators and actions to the page object
3. Write the test using only page class methods and named routes
4. Run it and confirm it shows what you meant
5. Run it a second time to confirm it's stable before committing a baseline
