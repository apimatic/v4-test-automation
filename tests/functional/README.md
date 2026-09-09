# Functional tests

Empty for now — the visual suite came first. Functional tests for the dxV2
portal go here and run under the `dxv2-functional` Playwright project:

```bash
pnpm test:functional
```

They share the same portal server and page objects as the visual suite, so a
functional test is just a test that asserts behaviour instead of pixels — search
returns the right results, the playground's Send button fires a request through
the CORS proxy, the sidebar navigates, the copy-page button copies.

Use the page objects in `pages/` and the route registry in `config/portals.ts`;
don't put raw locators in test files.
