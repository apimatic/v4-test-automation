# dxV2 Test Automation

Visual and functional test automation for **dx-portal V2** — the docs portal built
by [apimatic/apimatic-dx-portal-v2](https://github.com/apimatic/apimatic-dx-portal-v2).

The visual suite is up and running; the functional suite comes next.

## How this works

Unlike the V1 portal (a static bundle you could serve with `http-server`), a V2
portal is a **Next.js app generated from a customer build**. This repo owns
everything that's ours — the tests, the baselines, the build fixtures — and
fetches the portal app itself, at a version it pins:

```
config/portal-source.json        ← the portal app + the commit we pin to
test-builds/slack/               ← the build fixture
tests/ + dxv2-portal-snapshots/  ← the specs and their baselines
        │
        │  pnpm setup:portal  clones the pinned portal app into .portal/ (gitignored)
        ▼
.portal/apps/docs
  ├─ pnpm generate-docs -- --customer-build <build>   ← fixture -> .mdx + meta.json
  ├─ pnpm build                                       ← next build, prerenders every page
  └─ pnpm start                                       ← standalone server, on :3000
        │
        ▼
this repo's Playwright tests
```

**Why a production build and not `next dev`:** `next dev` compiles routes on
demand, and the first request to `/docs/[[...slug]]` — an SSG route spanning 182
pages — never finished inside a 12-minute budget on a CI runner. `next build`
does that work once (~30s) and then every page answers in milliseconds. It
renders identically: moving the suite from dev to production moved zero
baselines. `pnpm dev` is still there for poking at the portal by hand.

**Why not `next start`:** the portal sets `output: 'standalone'` in
next.config.ts, and `next start` refuses to serve such a build — it prints
"Ready", warns, and exits, so every request is refused. `pnpm start` runs the
standalone bundle instead (`.next/standalone/apps/docs/server.js`), copying in
the static assets and `public/` first, the same way the portal's Dockerfile
does. Skip that copy and every page renders unstyled.

`scripts/serve-portal.mts` runs those three stages, and Playwright's `webServer`
runs the script — so `pnpm test:visual` goes from nothing to a green suite in one
command.

**Why the portal app isn't just a dependency:** its `apps/docs` package is
`"private": true`, so it's never published to npm; no container image is published
either; and `generate-docs` is a script inside its source. Rendering a portal
needs that source. The most this repo can do is fetch it itself rather than ask
you to configure a path to it — which is what `setup:portal` does.

## Setup

Needs the portal's toolchain, because it runs the portal's own build:
**Node >= 24.14.0** and **pnpm**.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm setup:portal          # clones the pinned portal app into .portal/
```

That's the whole setup — nothing to configure, no paths to fill in. `.env` is
entirely optional; see `.env.example` for the overrides it offers.

`setup:portal` shallow-fetches the single pinned commit and installs the portal's
dependencies. It's the slow step, but it only re-runs when the pin changes.

**Already have a portal clone you work in?** Point `PORTAL_REPO` at it in `.env`
and `setup:portal` steps aside. Useful when you're changing the portal itself and
want the tests to see your working tree.

`.env` — all optional:

| Variable | What it does |
|---|---|
| `PORTAL` | Which build to test — a key in `config/portals.ts`, generated from `test-builds/`. Defaults to `slack`. |
| `PORTAL_PORT` | Port for the dev server. Defaults to `3000`. |
| `PORTAL_REPO` | Use a portal clone you already have instead of `.portal/`. |
| `PORTAL_REF` | Set up a portal ref other than the pinned one, without editing `config/portal-source.json`. |
| `PORTAL_BASE_URL` | Test a URL that's already serving (e.g. a deployed preview). Skips generate + serve entirely. |

## Running the tests

```bash
pnpm test:visual              # generate the portal, serve it, compare against baselines
pnpm test:visual:update       # accept the current rendering as the new baselines
pnpm report                   # open the HTML report
```

From a clean slate that's about 60s end to end: ~2s to generate, ~30s to build,
~4s to start, ~25s of tests.

`webServer` uses `reuseExistingServer` locally, so if the portal is already
running on `PORTAL_PORT` the tests attach to it and skip the rebuild. That's the
fast loop while you're writing tests — and everything runs from this directory,
because the portal's own scripts are mirrored here:

```bash
# Terminal 1 — generate, prerender, then serve on :3000
pnpm generate-docs -- --customer-build ./test-builds/slack
pnpm build
pnpm start

# Terminal 2 — tests attach to the running server
pnpm test:visual
```

| Script | Stage |
|---|---|
| `pnpm generate-docs` | fixture → `generated/docs/**` |
| `pnpm build` | `next build` — prerenders every page |
| `pnpm start` | serves the standalone bundle `next build` produced |
| `pnpm dev` | `next dev` instead, for browsing the portal by hand |
| `pnpm portal:serve` | all three stages in one go |

`generate-docs` takes the same `--customer-build <path>` flag as the portal's own
script, and it overrides the registry — handy for a build you haven't registered
in `config/portals.ts` yet. Omit it and it uses `PORTAL` from `.env`.

Testing a different build — copy it into `test-builds/` first, then:

```bash
$env:PORTAL="petstore"; pnpm test:visual   # after adding petstore to config/portals.ts
```

See [`test-builds/README.md`](./test-builds/README.md) for adding and refreshing
build fixtures.

## Pinning the portal version

`config/portal-source.json` pins the exact portal commit the committed baselines
were captured against, so a fresh clone of this repo reproduces them instead of
failing against whatever the portal's branch happens to be that day.

Bumping the pin is how you check the portal for regressions — and the pixel diff
*is* the report:

```bash
# edit config/portal-source.json -> new ref
pnpm setup:portal
pnpm test:visual
```

Green means the portal changed nothing visual. Red means it did: review the diffs,
then either file a bug or accept them with `pnpm test:visual:update`. Commit the
pin bump and any new baselines together, so the diff shows why the pixels moved.

To try a ref without committing to it:

```bash
$env:PORTAL_REF="apimatic-docs"; pnpm setup:portal
```

## Reviewing a visual failure

A failing snapshot is not automatically a bug — it's a difference. Open the report
and look at the three images Playwright attaches (expected / actual / diff):

```bash
pnpm report
```

- **Real regression** → file it against the portal repo, leave the baseline alone.
- **Intended UI change** → `pnpm test:visual:update`, then **look at the new PNGs
  before committing them.** A baseline committed without being looked at silently
  switches the test off.

## Layout

```
config/portals.ts          which builds we test + their routes — add portals here
config/portal-source.json  the portal app + the commit we pin to
test-builds/               the build fixtures themselves (see its README)
utils/env.ts               reads .env; single source of truth for "the portal under test"
utils/visual.ts            snapshot stability helpers (settle, snapshotOptions)
pages/                     page objects — all locators live here, never in tests
  BasePage.ts
  DocsPage.ts              one class covers every portal page (same chrome everywhere)
tests/visual/slack/        visual specs for the Slack build
tests/functional/          empty for now — functional suite goes here
scripts/setup-portal.mts   clone the pinned portal app into .portal/
scripts/serve-portal.mts   generate + serve a portal out of it
.portal/                   the portal app (gitignored — setup:portal manages it)
dxv2-portal-snapshots/     committed baselines, grouped by project/portal
```

## Notes and gotchas

- **Generating overwrites `apps/docs/app/theme.css` in the portal app**, which is
  tracked in git there. That's the portal's own build behaviour, not something
  this repo can avoid. Harmless for `.portal/` (throwaway), but it will dirty
  your own clone if you set `PORTAL_REPO`.
- **Snapshots are platform-specific.** These baselines were captured on
  `win32`/Chromium at a pinned 1920×1080. Rendering differs enough across
  operating systems that CI must run the same platform as whoever generated the
  baselines, or keep its own set.
- **The header renders several responsive variants of each control** and hides all
  but one. The icon-only `Open Search` / `Open Sidebar` buttons are the mobile
  variants and are `display: none` at desktop widths — don't reach for them.
- **The sidebar-collapse control only exists on pages with a collapsible sidebar**
  (the API Reference pages have it; Quickstart doesn't).
- **Headed mode fails two tests, and that's expected.** Headed and headless
  Chromium rasterize fonts slightly differently. The full-page snapshots absorb
  it, but the element-scoped ones (`portal-header`, `sidebar-api-reference`) are
  small crops where the same absolute difference is a much larger ratio. Use
  `pnpm test:visual:headed` to watch a run; use `pnpm test:visual` for a verdict.
- **Tests run with `workers: 1`.** They share one dev server that compiles routes
  on demand; running them in parallel makes both the timings and the pixels worse.

## CI

`.github/workflows/dxv2-visual.yml` runs the same stages as the local flow, kept
as separate steps so each log stands alone: `generate-docs`, `build`, `start`,
then the tests. Triggers on pushes and PRs to `main`, plus manual dispatch.

It runs on **windows-latest** deliberately — the committed baselines were
captured on win32/Chromium, and font rasterization differs enough across
operating systems that a ubuntu runner would fail every snapshot.

Two details worth knowing:

- **It needs a credential for the private portal repo.** `GITHUB_TOKEN` is scoped
  to this repo alone, so the workflow uses the org-level `ACTIONS_PAT` — the same
  secret other repos here use for cross-repo checkouts. Set a repo-level
  `PORTAL_REPO_TOKEN` if you'd rather use something narrowly scoped.
- **`PORTAL_BASE_URL` is set for the test step.** `reuseExistingServer` is off
  when `CI` is set, so without it Playwright would start a second server and race
  the one we just started for port 3000.

Manual dispatch takes a `portal_ref` input: leave it blank to test the pinned
commit, or set it to `apimatic-docs` to check the latest portal for regressions
without touching `config/portal-source.json`.

## Still to do

- Functional suite under `tests/functional/`.
- More portal builds — there are ~18 upstream under
  `apps/docs/test-specs/customer-build/`; vendor the ones worth testing into
  `test-builds/`.
