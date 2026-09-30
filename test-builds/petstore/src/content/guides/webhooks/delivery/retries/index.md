---
title: Retries
description: "What happens when your endpoint does not answer"
---


The Petstore API exposes pets, store orders and user accounts over HTTPS. Every request is authenticated, every response is JSON, and every list endpoint is paginated. This page walks through the parts of that contract you are most likely to need on your first integration, and points at the reference pages for the rest.

This page sits **4 levels** below the content root, at `/guides/webhooks/delivery/retries`.

## What this level covers

Requests are rate limited per API key rather than per IP address. When you exceed the limit the API answers `429 Too Many Requests` and sets `Retry-After` to the number of seconds remaining in the current window. The generated SDKs read that header and back off for you, so you only need to handle it directly if you are calling the API without an SDK.

| Endpoint | Method | Auth | Rate limit | Idempotent | Paginated | Typical latency | Introduced | Deprecated |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/pet` | POST | API key | 100/min | Yes | No | 45 ms | v3.0 | — |
| `/pet/{petId}` | GET | API key | 600/min | Yes | No | 18 ms | v3.0 | — |
| `/pet/findByStatus` | GET | API key | 300/min | Yes | Yes | 120 ms | v3.0 | — |
| `/pet/findByTags` | GET | API key | 300/min | Yes | Yes | 180 ms | v3.0 | v3.2 |
| `/store/order` | POST | OAuth 2 | 60/min | Yes | No | 90 ms | v3.0 | — |
| `/store/inventory` | GET | API key | 30/min | Yes | No | 240 ms | v3.1 | — |
| `/user/login` | GET | None | 10/min | No | No | 60 ms | v3.0 | v3.3 |


## Worked example

```ts
import { SwaggerPetstoreOpenApi30Client, ApiError } from "@acme/petstore-sdk";

const client = new SwaggerPetstoreOpenApi30Client({ apiKey: process.env.PETSTORE_API_KEY });

export async function listAvailablePets(limit = 100): Promise<Pet[]> {
  try {
    const { result } = await client.petController.findPetsByStatus({ status: "available", limit });
    return result;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 429) {
      const retryAfterSeconds = Number(error.headers["retry-after"] ?? 1);
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
      return listAvailablePets(limit);
    }
    throw error;
  }
}
```

## Checklist

1. Create an API key in the dashboard and store it outside your source tree.
2. Install the SDK for your language from its public registry.
    - TypeScript from npm
    - Python from PyPI
    - C# from NuGet
3. Construct one client and reuse it for the lifetime of your process.
    - The client owns a connection pool
    - Constructing one per request exhausts sockets under load
        - On Linux you will see `EADDRNOTAVAIL` first
        - On Windows the symptom is a slow creep in handle count
4. Make your first call against a read-only endpoint to confirm credentials.
5. Add error handling for `429` and `5xx` before you go to production.


> Pets created through the API are visible to every user in your organisation
> immediately. There is no draft state, and no soft delete: a `DELETE` removes
> the record and its photo attachments in the same transaction.

