# auth build

One operation per auth type, for the functional tests of the API Reference's
auth section. Every operation points at a route of APIMatic's **API Tester**,
which checks credentials against hardcoded values.

## Start the API Tester first

```sh
node api-tester/bin/www     # http://localhost:3000
```

The server is the trimmed copy in `api-tester/` (see its README). The spec's
server URL is `http://localhost:3000`. CORS is open (`*`), so the playground
can call it from the served portal.

## Credentials

| Scheme id | Type | Value |
|---|---|---|
| `basicAuth` | http basic | `Zeeshan` / `bhai_99` (also `farhan` / `apimatic`) |
| `bearerAuth` | http bearer | `0b79bab50daca910b000d4f1a2b675d604257e42` |
| `customHeader` | apiKey header `accesstoken` | `azHmdOe09EdchxeWsdnplkQbv76sJH` |
| `headerToken` / `headerApiKey` | apiKey header `token` / `api-key` | `Qaws2W233WedeRe4T56G6Vref2` / `api-key` |
| `queryToken` / `queryApiKey` | apiKey query `token` / `api-key` | `asdqwaxr2gSdhasWSDbdAgdA637sdAhde7Adysi23` / `api-key` |
| `oauthClientCredentials` | oauth2 clientCredentials | client `23` / `tQNSqQlXBIwZcY9auoujQ57ckDcoh3t8UPbBRkSF` |
| `oauthAuthCode` | oauth2 authorizationCode | client `24` / `Y9auoujQ57ckDtQNSqQlXBIwZccoh3t8UPbBRkSF`; returns `code=910b000d4f` |
| `oauthPassword` | oauth2 password | client `25` / `ckDcoh3t8UPbBRkSFtQNSqQlXBIwZcY9auoujQ57`; user `apimatic` / `api-d604257e42-matic` |

## Operations

Validated routes answer `200 You've passed the test!` (OAuth `status`/`user`:
`{"status":"passed"}`) and `401` with a body naming what failed.

| Tag | operationId | Route | security |
|---|---|---|---|
| Single | `noAuth` | `/auth/skipAuthentication` | none (sending a `token` query gives 400) |
| Single | `basic` | `/auth/basic` | `basicAuth` |
| Single | `bearer` | `/auth/oauth2` | `bearerAuth` |
| Single | `apiKeyHeader` | `/auth/customAuthentication` | `customHeader` |
| Single | `apiKeyQuery` | `/auth/customQueryParam` | `queryToken` AND `queryApiKey` |
| Single | `apiKeyHeaderPair` | `/auth/customHeaderSignature` | `headerToken` AND `headerApiKey` |
| Combination | `orAuth` | `/auth/customQueryOrHeaderParam` | query pair OR header pair |
| Combination | `andAuth` | `/auth/basicAndApiKeyAndApiHeader` | Basic AND query pair AND header pair |
| Combination | `orOfAnds` | `/auth/multipleAuthCombination` | `customHeader` OR `bearerAuth` OR (Basic AND both pairs) |
| OAuth 2 | `clientCredentials` | `/oauth2/auth-server` | `oauthClientCredentials` |
| OAuth 2 | `authorizationCode` | `/oauth2/non-auth-server/user` | `oauthAuthCode` |
| OAuth 2 | `password` | `/oauth2/non-auth-server/status` | `oauthPassword` |
| OAuth 2 | `oauthOrBearer` | `/oauth2/oauthOrCombination` | `oauthClientCredentials` OR `bearerAuth` |
| Unvalidated | `apiKeyCookie` | `/unvalidated/apiKeyCookie?echo=true` | apiKey in cookie |
| Unvalidated | `implicit` | `/unvalidated/implicit?echo=true` | oauth2 implicit |
| Unvalidated | `openIdConnect` | `/unvalidated/openIdConnect?echo=true` | openIdConnect |
| Unvalidated | `digest` | `/unvalidated/digest?echo=true` | http digest |

The **Unvalidated** operations hit the API Tester's catch-all, which echoes the
request back as JSON (`path`, `query`, `headers`, `method`, `body`). There's no
checker for these schemes, so they only show rendering and what was sent.
OAuth1 is supported by the API Tester but can't be expressed in OpenAPI 3.

## API Tester quirks

- **Client credentials** are only accepted as a Basic `Authorization` header on
  the token request — sending `client_id`/`client_secret` in the body gives
  `401 invalid_client`.
- **Authorization code**: `/oauth2/auth-server/oauth/authorize` accepts any
  `redirect_uri` and redirects with `code=910b000d4f`, but drops `state`.
- **Issued tokens** live in memory for 3600s and are lost when the API Tester
  restarts. The refresh token equals the access token.
- **The static bearer token** is not an "issued" OAuth token; it only passes
  where `bearerAuth` is declared (`bearer`, `orOfAnds`, `oauthOrBearer`).
