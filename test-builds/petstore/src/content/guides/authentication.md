---
title: Authentication
description: "API keys, OAuth 2 and which endpoints accept which"
---


Requests are rate limited per API key rather than per IP address. When you exceed the limit the API answers `429 Too Many Requests` and sets `Retry-After` to the number of seconds remaining in the current window. The generated SDKs read that header and back off for you, so you only need to handle it directly if you are calling the API without an SDK.

A sibling page at depth 1, reached at `/guides/authentication`.

## Detail

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


```python
import os
from petstore_sdk import SwaggerPetstoreOpenApi30Client, ApiException

client = SwaggerPetstoreOpenApi30Client(api_key=os.environ["PETSTORE_API_KEY"])

def list_available_pets(limit: int = 100):
    try:
        return client.pet.find_pets_by_status(status="available", limit=limit)
    except ApiException as exc:
        if exc.status_code == 429:
            raise RuntimeError("rate limited; let the SDK retry policy handle this") from exc
        raise
```

## Notes

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

