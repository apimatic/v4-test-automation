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

Add the SDK to your project from its folder, with whichever package manager your project uses. Give each tool a path containing a slash, such as `../swagger-petstore-open-api-3-0` — a bare folder name is looked up on PyPI instead, and resolves to whatever project holds that name there:

```bash
pip install <path-to-sdk>
```

```bash
uv add <path-to-sdk>
```

```bash
poetry add <path-to-sdk>
```

## Quick Start

### Synchronous client

Construct `SwaggerPetstoreOpenApi30Client` with keyword arguments, and call `close()` when you are done. Every argument is optional.

```python
from swagger_petstore_open_api_3_0 import SwaggerPetstoreOpenApi30Client

client = SwaggerPetstoreOpenApi30Client(petstore_auth="YOUR_API_KEY", api_key="YOUR_API_KEY")

client.close()
```

Alternatively, scope it — `with SwaggerPetstoreOpenApi30Client(...) as client:` closes the pool on exit.

### Asynchronous client

`AsyncSwaggerPetstoreOpenApi30Client` mirrors `SwaggerPetstoreOpenApi30Client` with **identical method names**, and every endpoint method is a coroutine. It takes the same arguments, with some differences — for example, the transport argument is `custom_async_http_client`.

```python
from asyncio import run

from swagger_petstore_open_api_3_0 import AsyncSwaggerPetstoreOpenApi30Client

async def main() -> None:
    client = AsyncSwaggerPetstoreOpenApi30Client(petstore_auth="YOUR_API_KEY", api_key="YOUR_API_KEY")
    await client.aclose()

run(main())
```

Alternatively, scope it — `async with AsyncSwaggerPetstoreOpenApi30Client(...) as client:` closes the pool on exit.
