<!-- docs key: gettingStarted -->

## Intro

The Swagger Petstore - OpenAPI 3.0 SDK provides access to the [Swagger Petstore - OpenAPI 3.0 REST APIs](https://swagger.io).

This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can find out more about
Swagger at [https://swagger.io](https://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!
You can now help us improve the API whether it's by making changes to the definition itself or to the code.
That way, with time, we can improve the API in general, and expose some of the new features in OAS3.

Some useful links:
- [The Pet Store repository](https://github.com/swagger-api/swagger-petstore)
- [The source API definition for the Pet Store](https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml)

## Installation

To add the SDK to your project from npm:

```bash
npm install @acme/petstore-sdk
```

To install from the SDK source instead, compile it to `dist/` — run its `build` script once in the SDK folder — then add it to your project by path:

```bash
npm install <path-to-sdk>
```

## Quick Start

Create one client and reuse it. Configure its behaviour through `ClientOptions`.

```ts
import { SwaggerPetstoreOpenApi30Client } from "@acme/petstore-sdk";

const client = new SwaggerPetstoreOpenApi30Client({
  petstoreAuth: "YOUR_API_KEY",
  apiKey: "YOUR_API_KEY",
});
```

Nothing in `ClientOptions` is required — `new SwaggerPetstoreOpenApi30Client()` compiles — and each option left out falls back to its default. This API declares one environment, so there is no environment to select and no host to state at the construction site.

### From CommonJS

The package ships both dialects from a single entry, so `require` works with full types. In a TypeScript CommonJS file use the `import ... = require(...)` form — a plain destructuring `require` runs fine but gives you `any`.

```ts
import sdk = require("@acme/petstore-sdk");

const client = new sdk.SwaggerPetstoreOpenApi30Client({
  petstoreAuth: "YOUR_API_KEY",
  apiKey: "YOUR_API_KEY",
});
```
