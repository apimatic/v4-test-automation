---
title: Webhooks
description: "Receiving events instead of polling for them"
---


Errors carry a machine-readable `code` alongside the human-readable `message`. Match on `code` in your own error handling: the `message` is written for a developer reading a log and may be reworded between releases, while `code` is part of the contract and changes only with a major version bump.

This page sits **2 levels** below the content root, at `/guides/webhooks`.

## What this level covers

Every mutating endpoint accepts an idempotency key. Send the same key with a retried request and the API returns the original response rather than performing the operation twice. Keys are scoped to your account and expire after 24 hours, which is long enough to cover a retry queue draining after an outage but short enough that keys can be recycled.

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

