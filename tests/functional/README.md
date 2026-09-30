# Functional tests

Stage 4 of the pipeline, and deliberately empty for now — the structure is
wired up (the `functional` Playwright project points here) but no cases are
written yet.

Functional tests answer what the portal *does*, which a screenshot can't judge:
navigation destinations, search actually matching, downloads being served,
state surviving a reload. The portal is a client-routed SPA, so a broken route
shows as a blank shell rather than a server error — exactly the failure a
visual test absorbs and a functional test catches.

When adding cases:

```bash
mkdir tests/functional/<build>
pnpm test:functional
```

Use the page objects in `pages/` and the named routes in `config/portals.ts`;
don't put raw locators in test files.
