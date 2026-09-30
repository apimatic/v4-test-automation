# Functional tests

Stage 4 of the pipeline, and deliberately empty for now — the structure is
wired up (the `functional` Playwright project points here) but no cases are
written yet.

Functional tests answer what the portal *does*, which a screenshot can't judge:
navigation destinations, search actually matching, downloads being served,
state surviving a reload. The portal is a client-routed SPA, so a broken route
shows as a blank shell rather than a server error — exactly the failure a
visual test absorbs and a functional test catches.

While this folder is empty, `pnpm test:functional` runs with
`--pass-with-no-tests` — Playwright exits 1 on "No tests found", which would
fail CI for a stage that has nothing to run yet. Drop that flag once there are
cases, so a mistyped `testDir` can't pass silently.

When adding cases:

```bash
mkdir tests/functional/<build>
pnpm test:functional
```

Use the page objects in `pages/` and the named routes in `config/portals.ts`;
don't put raw locators in test files.
