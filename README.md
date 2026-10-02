# v4 Test Automation

Test automation for **APIMatic v4 portals** — the static documentation portals
produced by `apimatic portal generate`.

The repo is structured around the order things happen: portals are generated
from a build and checked against what the build declared, and only then is the
portal served and tested in a browser.

## The pipeline

```
test-builds/petstore/src/         the build: apimatic.json, content/, spec/, static/
        │
        ├──▶ 1. ARTIFACTS   per scenario: copy src/ to a temp folder, change it,
        │                   generate, compare produced vs declared
        │                   filesystem only — no browser, no server
        │
        │  apimatic portal generate --input test-builds/petstore
        ▼
test-builds/petstore/portal/      the generated portal (gitignored)
        │
        │  http-server -c-1 --cors
        ▼
   http://127.0.0.1:8080
        │
        ├──▶ 2. VISUAL      how it looks, against committed baselines
        └──▶ 3. FUNCTIONAL  what it does (structure in place, cases to come)
```

Each stage catches something the next one can't. Artifacts catch a portal built
wrong — an SDK missing, a declared version that never reached the manifest.
Visual catches one that renders wrong. Functional catches one that renders fine
and behaves wrong.

## Setup

Needs the **APIMatic CLI** and **http-server** on your PATH, plus Node and pnpm.

```bash
npm install -g @apimatic/cli http-server
pnpm install
pnpm exec playwright install chromium
```

Everything else resolves inside this repo — there is nothing to clone, pin or
configure.

`.env` — all optional:

| Variable | What it does |
|---|---|
| `PORTAL` | Which build to test — a key in `config/portals.ts`. Defaults to `petstore`. |
| `PORTAL_PORT` | Port for http-server. Defaults to `8080`. |
| `PORTAL_BASE_URL` | Test a portal that's already hosted. Skips generate and serve entirely. |

## Running

```bash
pnpm portal:generate     # apimatic portal generate, nothing else
pnpm portal:serve        # generate, then serve on :8080

pnpm test                # all three projects
pnpm test:artifacts      # stage 1 — generates its own portals, no server
pnpm test:visual         # stage 2
pnpm test:functional     # stage 3 (empty for now — passes with no tests)

pnpm test:visual:update  # accept the current rendering as the new baselines
pnpm report              # open the HTML report
```

`webServer` uses `reuseExistingServer` locally, so if a portal is already up on
`PORTAL_PORT` the tests attach to it. To drive the two commands yourself:

```bash
cd test-builds/petstore
apimatic portal generate --force
cd portal
http-server -c-1 --cors
```

`-c-1` disables caching, so a regenerated portal is served immediately rather
than from a stale cache — which otherwise shows up as a snapshot that
mysteriously refuses to change.

## Stage 1 — artifacts

`tests/artifacts/` compares a generated bundle to the `apimatic.json` it was
built from.

The config is a set of promises: `languages` promises a downloadable archive, a
portal page and a package manifest carrying the identity you asked for;
`plugin` promises a context-plugin page; `brand` and `navigation` promise assets
and links. The artifact suite is where those promises get checked.

Each scenario generates its own portal. `generateScenario()` in
`utils/scenario.ts` copies the build's `src/` to a temp folder, applies the
scenario's changes, runs `apimatic portal generate` on the copy and hands back
the output. The committed build is never edited:

```ts
test.describe("the plugin block removed from apimatic.json", () => {
  let portal: GeneratedPortal;

  test.beforeAll(async () => {
    portal = await generateScenario("without plugin", {
      config: (config) => { delete config.plugin; },  // edit apimatic.json
      // files:  { "content/guides/new.md": "# New" }, // add or overwrite files
      // remove: ["spec/APIMATIC-META.json"],          // delete files or folders
    });
  });
  test.afterAll(() => portal?.cleanup());

  test("no context-plugin page is generated", () => {
    expect(portal.exists("context-plugin", "index.html")).toBe(false);
  });
});
```

One `describe` is one scenario and one generation (~35s, ~13 MB), shared by
every test inside it — so group related checks under one scenario. Temp folders
are deleted afterwards; set `KEEP_SCENARIOS=1` to keep them for a look. A
scenario whose generation fails reports the tail of the CLI's output.

Because the suite generates for itself, a run of only `--project=artifacts`
doesn't start the web server.

`utils/artifacts.ts` has the reading side: `GeneratedPortal` (the declared
config of the copy, and the generated tree), and reading a package manifest out
of an SDK archive without extracting it (`package.json`, `pyproject.toml` or
`.csproj`, normalised so a test doesn't have to know which language spells its
package id how).

## Stage 2 — visual

`tests/visual/` compares screenshots against baselines in `portal-snapshots/`.

14 tests, chosen to cover each distinct render path the build exercises rather
than to cover many pages:

| Area | Cases |
|---|---|
| Shell | landing page, landing page dark, top bar, sidebar tree |
| Authored content | a guide page, accordions, tabs, GFM tables |
| Generated from `apimatic.json` | SDKs index, the TypeScript SDK page, the context plugin page |
| Generated from the spec | an API endpoint page |
| Interaction and layout | search overlay with results, mobile viewport |

Two are element-scoped — the top bar and the sidebar — so a change in page
content doesn't fail them. The rest are full viewport.

Snapshots are platform-specific: these were captured on win32/Chromium at a
pinned 1920×1080, so CI runs `windows-latest` to match.

## Stage 3 — functional

`tests/functional/` is wired up and empty. See its README — the script runs with
`--pass-with-no-tests` until there are cases, because Playwright exits 1 on
"No tests found" and that would fail CI for a stage with nothing to run.

## Layout

```
config/portals.ts          which builds we test + their named routes
test-builds/<name>/src/    the build input (apimatic.json, content, spec, static)
test-builds/<name>/portal/ generated output — gitignored, rebuilt every run
utils/env.ts               resolves build dir, generated dir, port, baseURL
utils/scenario.ts          copy src/ to a temp folder, change it, generate
utils/artifacts.ts         declared-vs-produced helpers, zip manifest reading
utils/visual.ts            snapshot stability helpers
pages/                     page objects — locators live here, never in tests
tests/artifacts/<build>/   stage 1
tests/visual/<build>/      stage 2
tests/functional/          stage 3
scripts/serve-portal.mts   generate + serve
portal-snapshots/          committed visual baselines
```

## CI

`.github/workflows/portal-tests.yml` runs the same pipeline on
**windows-latest** (the baselines were captured there), each stage its own step:

```
install + authenticate the CLI  ->  artifacts  ->  generate  ->  visual  ->  functional
```

### Environments

Generation is subscription-gated, so the runner authenticates with an APIMatic
account. Two are configured, and a manual run picks between them:

| Secret | Used when |
|---|---|
| `APIMATIC_AUTH_KEY_DEV` | default — every push and PR, and manual runs left on `dev` |
| `APIMATIC_AUTH_KEY_PROD` | manual runs with `environment: prod` |

Routine CI stays on dev so it never spends against the production account. The
choice matters beyond billing: the two accounts have their own subscriptions, so
which one runs decides which languages are allowed, and therefore which SDK
artifacts the generator is even able to produce. That's why the workflow prints
`apimatic auth status` — a subscription that doesn't cover a declared language
would explain a missing archive.

Run against prod from the Actions tab, or:

```bash
gh workflow run portal-tests.yml --repo apimatic/v4-test-automation -f environment=prod
```

The key is checked before login, so a missing one fails with a message naming
the exact secret rather than an opaque CLI error several steps later. Reports and
failure output are named per environment, so a dev and a prod run don't collide.

The CLI version is pinned in the workflow (`APIMATIC_CLI_VERSION`) so a new
release can't silently change the generated output and move every baseline. The
`workflow_dispatch` inputs let you try another CLI version, or another build,
without committing to either.

## Known issues in the petstore build

- **`/components/mermaid/` crashes at runtime.** It serves HTTP 200, but the
  page throws `Expected component 'Mermaid' to be defined` (React error #419)
  and the shell never mounts. Generation reports no error. The route is left
  out of `config/portals.ts` rather than left failing — add it back once the
  component is provided.
- **Declared SDK versions don't reach the manifests.** `apimatic.json` declares
  typescript `2.4.0`, python `1.0.3` and csharp `3.1.2`; the archives ship
  `1.0.26`, `1.0.26` and no `<Version>` element at all. Package *names* are
  correct in all three. The check is marked `test.fail()` — it keeps reporting
  the mismatch without turning CI red for everything else, and Playwright flags
  it the moment it starts passing. Remove that line when it's fixed.
