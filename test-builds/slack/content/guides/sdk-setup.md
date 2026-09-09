# SDK Setup

> **One install command and one client constructor away from your first call.** Each SDK is generated from the same OpenAPI spec, follows the conventions of its language ecosystem, and ships with retries, error types, and pagination already wired up.

If you haven't created a Slack App yet, start with [Get API Credentials](page:guides/get-api-credentials) — you'll need a bot token (`xoxb-...`) for every example below.

---

## Pick Your Language

<CardGroup cols={4}>
<Card title="TypeScript" icon="FileCode" url="#typescript">
npm · `slack-apimatic-sdk`
</Card>
<Card title="Python" icon="FileCode" url="#python">
PyPI · `slack-apimatic-sdk`
</Card>
<Card title="Java" icon="FileCode" url="#java">
Maven · `io.sdks:slack-apimatic-sdk`
</Card>
<Card title="C# / .NET" icon="FileCode" url="#csharp">
NuGet · `SlackApimaticSdk`
</Card>
<Card title="PHP" icon="FileCode" url="#php">
Composer · `ai-apimatic/slack-apimatic-sdk`
</Card>
<Card title="Ruby" icon="FileCode" url="#ruby">
RubyGems · `slack-apimatic-sdk`
</Card>
<Card title="HTTP / cURL" icon="Terminal" url="page:endpoints">
Use any HTTP client.
</Card>
</CardGroup>

---

:::visible {language=ts}
## TypeScript

**Install**

```bash
npm install slack-apimatic-sdk
```

**Configure and call**

```typescript
import { Client } from 'slack-apimatic-sdk';

const slack = new Client({
  token: process.env.SLACK_BOT_TOKEN!,
});

const me = await slack.authController.test();
console.log(me.result);
```

The TypeScript SDK ships with full type definitions — every method, parameter, and response is typed. Use it from Node.js, Deno, or any TypeScript runtime that supports ESM or CommonJS.
:::

---

:::visible {language=python}
## Python

**Install**

```bash
pip install slack-apimatic-sdk
```

**Configure and call**

```python
import os
from slackapimaticsdk.client import Client

slack = Client(token=os.environ['SLACK_BOT_TOKEN'])

me = slack.auth.test()
print(me.body)
```

Supports Python 3.8+. All responses are typed dataclasses; errors raise typed exceptions you can catch by status or error code.
:::

---

:::visible {language=java}
## Java

**Install (Maven)**

```xml
<dependency>
  <groupId>io.sdks</groupId>
  <artifactId>slack-apimatic-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

**Install (Gradle)**

```gradle
implementation 'io.sdks:slack-apimatic-sdk:1.0.0'
```

**Configure and call**

```java
import io.sdks.slack.SlackClient;

SlackClient slack = new SlackClient.Builder()
    .token(System.getenv("SLACK_BOT_TOKEN"))
    .build();

var me = slack.getAuthController().test();
System.out.println(me.getResult());
```

Targets Java 11+ and works with Spring Boot, Jakarta EE, or plain JVM apps.
:::

---

:::visible {language=csharp}
## C# / .NET

**Install**

```bash
dotnet add package SlackApimaticSdk
```

**Configure and call**

```csharp
using SlackApimaticSdk;

var slack = new SlackClient.Builder()
    .Token(Environment.GetEnvironmentVariable("SLACK_BOT_TOKEN"))
    .Build();

var me = await slack.AuthController.TestAsync();
Console.WriteLine(me.Data);
```

Targets .NET Standard 2.0 — works on .NET Framework 4.6.1+, .NET Core, and .NET 6+.
:::

---

:::visible {language=php}
## PHP

**Install**

```bash
composer require ai-apimatic/slack-apimatic-sdk
```

**Configure and call**

```php
use SlackApimaticSdk\SlackClientBuilder;

$slack = SlackClientBuilder::init()
    ->token(getenv('SLACK_BOT_TOKEN'))
    ->build();

$me = $slack->getAuthController()->test();
print_r($me->getResult());
```

Requires PHP 7.4 or later. Composer-only — no PEAR.
:::

---

:::visible {language=ruby}
## Ruby

**Install**

```bash
gem install slack-apimatic-sdk
```

Or in your `Gemfile`:

```ruby
gem 'slack-apimatic-sdk'
```

**Configure and call**

```ruby
require 'slack_apimatic_sdk'

slack = SlackApimaticSdk::Client.new(token: ENV['SLACK_BOT_TOKEN'])

me = slack.auth.test
puts me.data
```

Targets Ruby 2.7+ and works with Rails, Sinatra, or standalone scripts.
:::

---

:::visible {language=http}
## HTTP / cURL

No SDK install needed — every Slack endpoint is reachable as a plain HTTPS call. Pick this path when you're scripting something simple, working in a language without an SDK, or testing endpoints from a terminal.

**Configure and call**

```bash
export SLACK_BOT_TOKEN="xoxb-your-token-here"

curl -X POST "https://slack.com/api/auth.test" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json"
```

A successful response:

```json
{
  "ok":       true,
  "url":      "https://your-workspace.slack.com/",
  "team":     "Your Workspace",
  "user":     "your-app",
  "team_id":  "T0123456789",
  "user_id":  "U0123456789",
  "bot_id":   "B0123456789"
}
```

For richer interactions, set `Content-Type: application/json` and send a JSON body (e.g., `chat.postMessage` with `blocks`). The same retry, rate-limit, and signature-verification rules apply — you'll just implement them yourself instead of inheriting them from the SDK. Browse every endpoint in the [API Reference](page:endpoints).
:::

---

## What's Built In

Every SDK in this portal comes with the same baseline:

<CardGroup cols={2}>
<Card title="Automatic retries" icon="RotateCw">
Failed requests retry with exponential backoff. Rate-limit responses (`429`) are honored automatically.
</Card>
<Card title="Typed errors" icon="ShieldAlert">
Slack's error responses (`invalid_auth`, `missing_scope`, `channel_not_found`) become typed exceptions you can catch by name.
</Card>
<Card title="Pagination helpers" icon="ChevronsRight">
Cursor-based list endpoints (`conversations.list`, `users.list`) expose iterators so you don't write the cursor loop yourself.
</Card>
<Card title="Request signing helpers" icon="Lock">
Verify the `X-Slack-Signature` header on inbound events with a one-line helper — no hand-rolled HMAC.
</Card>
</CardGroup>

---

## AI Coding Assistants

Every SDK ships with auto-generated context for AI editors. Drop the [llms.txt](https://docs.apimatic.io/) into Cursor, Claude Code, or GitHub Copilot and your assistant gets the full API surface, method signatures, and idiomatic examples.

This portal exposes context plugins for:

- **Cursor**
- **VS Code (Copilot)**
- **Claude Code**

Enable them on the language picker in the API Reference.

---

## Next Steps

<CardGroup cols={2}>
<Card title="5-Minute Quickstart" icon="Rocket" url="page:guides/quickstart">
End-to-end: create an app, install the SDK, post your first message.
</Card>
<Card title="API Reference" icon="BookOpenText" url="page:endpoints">
Browse every endpoint with live, language-specific code samples.
</Card>
<Card title="Recipes" icon="ChefHat" url="page:recipes/PostedMessageWithThreadReplyFlow">
Copy-paste flows for the most common Slack patterns.
</Card>
<Card title="Sample App" icon="Github" url="page:sample-app/analytics">
A complete Slack app built with the TypeScript SDK.
</Card>
</CardGroup>