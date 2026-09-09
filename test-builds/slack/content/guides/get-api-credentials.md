

> **Every Slack API call needs a token.** This guide walks you through creating a Slack App, picking scopes, installing it to a workspace, and grabbing the bot token you'll use for every request.

<Callout type="info">
**Time to credentials: ~3 minutes.** No code in this guide — just clicks and a copy-paste. Head to the [5-minute quickstart](page:guides/quickstart) once you have your token.
</Callout>

---

## Prerequisites

---

## Step-by-Step

<Callout type="warning">
**Reinstall after every scope change.** Adding or removing OAuth scopes only takes effect after you click **Reinstall to Workspace** — the existing token stays bound to the old scope set.
</Callout>

---

## Which Token Do I Use?

Slack hands you two kinds of tokens depending on what your app needs to do. Most integrations only ever touch the bot token.

---

## Verify Your Token

Before you start writing real code, confirm the token works. The fastest sanity check is `auth.test` — it echoes back the workspace, user, and bot IDs your token resolves to.
```bash
curl -X POST "https://slack.com/api/auth.test" \
  -H "Authorization: Bearer xoxb-your-bot-token" \
  -H "Content-Type: application/json"
```

```typescript
import { Client } from 'slack-apimatic-sdk';

const slack = new Client({ token: process.env.SLACK_BOT_TOKEN! });

const me = await slack.authController.test();
console.log(me.result);
```

```python
import os
from slackapimaticsdk.client import Client

slack = Client(token=os.environ['SLACK_BOT_TOKEN'])

me = slack.auth.test()
print(me.body)
```

```java
import io.sdks.slack.SlackClient;

SlackClient slack = new SlackClient.Builder()
    .token(System.getenv("SLACK_BOT_TOKEN"))
    .build();

var me = slack.getAuthController().test();
System.out.println(me.getResult());
```

```csharp
using SlackApimaticSdk;

var slack = new SlackClient.Builder()
    .Token(Environment.GetEnvironmentVariable("SLACK_BOT_TOKEN"))
    .Build();

var me = await slack.AuthController.TestAsync();
Console.WriteLine(me.Data);
```

```php
use SlackApimaticSdk\SlackClientBuilder;

$slack = SlackClientBuilder::init()
    ->token(getenv('SLACK_BOT_TOKEN'))
    ->build();

$me = $slack->getAuthController()->test();
print_r($me->getResult());
```

```ruby
require 'slack_apimatic_sdk'

slack = SlackApimaticSdk::Client.new(token: ENV['SLACK_BOT_TOKEN'])

me = slack.auth.test
puts me.data
```

A successful response looks like:

```json
{
  "ok": true,
  "url": "https://your-workspace.slack.com/",
  "team": "Your Workspace",
  "user": "your-app",
  "team_id": "T0123456789",
  "user_id": "U0123456789",
  "bot_id": "B0123456789"
}
```

If `ok` is `true`, your token is live and you're ready to post a real message.

---

## Common Setup Errors

---

## Distributing to Other Workspaces

If your app will be installed by *other people's* workspaces (the Slack Marketplace path), you'll layer OAuth v2 on top of the steps above: redirect users to Slack's authorization URL, handle the callback with a `code`, exchange it for an access token via `oauth.v2.access`, and store the token keyed by `team_id`.

The full pattern lives in [Building Integrations](page:guides/integrations#pattern-2--distributing-your-app).

---

## Next Steps
