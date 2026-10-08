# api-tester

The auth routes of APIMatic's **API Tester**, trimmed to what
`test-builds/auth` uses. The full server is private; this copy is taken from
upstream commit `db81cdb`.

```sh
node api-tester/bin/www     # http://localhost:3000 (override with PORT)
```

Its dependencies (`express`, `cors`, `basic-auth`) are in the root
`package.json`, so `pnpm install` at the root is all it needs. `package.json`
here only marks the folder as CommonJS, because the root is ESM.

## What's kept

| File | Source |
|---|---|
| `routes/auth.js` | verbatim — Basic, bearer, API key, custom header, AND/OR checkers |
| `routes/oauth2.js` | verbatim — token endpoints and OAuth 2 checkers |
| `routes/index.js` | verbatim — catch-all; `?echo=true` returns the request |
| `utils/authentications.js` | verbatim — the credential checks and expected values |
| `bin/www` | verbatim |
| `app.js` | rewritten — mounts only the three routers above |

To pick up upstream changes, diff these four files against the private repo.
`test-builds/auth/README.md` maps each route to its operation and credentials.

## Not kept

- Every other router (`/body`, `/query`, `/response`, type combinators, …),
  the jade views, static assets, `files/` fixtures, Grunt, Docker and multer.
- `oauth-signature`, so the OAuth1 routes in `routes/auth.js` (`oauth1`,
  `oauth3`, `oneLeggedAuth`, `pkcs12Certificate`) answer 500 once an OAuth1
  header is sent. OpenAPI 3 can't describe OAuth1, so the auth build doesn't
  use them.
- `basic-auth` stays on 2.x: 3.x dropped the `auth(req)` call that
  `utils/authentications.js` uses, and every Basic check answers 500 with it.
