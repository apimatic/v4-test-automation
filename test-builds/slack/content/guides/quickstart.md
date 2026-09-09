

> **Goal:** Post your first message to a Slack channel using the SDK in your preferred language. By the end of this guide you'll have a working app, a bot token, and a successful API response.

---

## Step 1 — Create Your Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App**.
2. Choose **From scratch**.
3. Name your app (e.g., `My First App`), pick a workspace, and click **Create App**.

You'll land on the **Basic Information** page for your new app.

---

## Step 2 — Add Bot Scopes and Install

Your app needs **scopes** that describe what it can do.

1. In the left sidebar, click **OAuth & Permissions**.
2. Scroll to **Scopes** → **Bot Token Scopes** and add:
   - `chat:write` — post messages
   - `channels:read` — list public channels
3. Scroll to the top and click **Install to Workspace** → **Allow**.
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`). Keep it secret.

---

## Step 3 — Invite Your Bot to a Channel

In Slack, open the channel you want to post to (e.g., `#general`) and run:

```
/invite @My First App
```

Replace `My First App` with whatever you named the bot. Your app can only post to channels it's been invited to.

---

## Step 4 — Install the SDK and Send Your First Message

Pick your language and copy the snippet. Set `SLACK_BOT_TOKEN` in your environment first:

```bash
export SLACK_BOT_TOKEN="xoxb-your-token-here"
```
### TypeScript

```bash
npm install slack-apimatic-sdk
```

```typescript
import { Client } from 'slack-apimatic-sdk';

const client = new Client({
  token: process.env.SLACK_BOT_TOKEN!,
});

const response = await client.chatController.postMessage({
  channel: '#general',
  text: 'Hello from my first Slack app! :wave:',
});

console.log(response.result);
```

### Python

```bash
pip install slack-apimatic-sdk
```

```python
import os
from slackapimaticsdk.client import Client

client = Client(token=os.environ['SLACK_BOT_TOKEN'])

response = client.chat.post_message(
    channel='#general',
    text='Hello from my first Slack app! :wave:',
)

print(response.body)
```

### Java

```xml
<dependency>
  <groupId>io.sdks</groupId>
  <artifactId>slack-apimatic-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

```java
import io.sdks.slack.SlackClient;

SlackClient client = new SlackClient.Builder()
    .token(System.getenv("SLACK_BOT_TOKEN"))
    .build();

var response = client.getChatController().postMessage(
    "#general",
    "Hello from my first Slack app! :wave:"
);

System.out.println(response.getResult());
```

### C# / .NET

```bash
dotnet add package SlackApimaticSdk
```

```csharp
using SlackApimaticSdk;

var client = new SlackClient.Builder()
    .Token(Environment.GetEnvironmentVariable("SLACK_BOT_TOKEN"))
    .Build();

var response = await client.ChatController.PostMessageAsync(
    channel: "#general",
    text: "Hello from my first Slack app! :wave:"
);

Console.WriteLine(response.Data);
```

### PHP

```bash
composer require ai-apimatic/slack-apimatic-sdk
```

```php
use SlackApimaticSdk\SlackClient;

$client = SlackClientBuilder::init()
    ->token(getenv('SLACK_BOT_TOKEN'))
    ->build();

$response = $client->getChatController()->postMessage([
    'channel' => '#general',
    'text'    => 'Hello from my first Slack app! :wave:',
]);

print_r($response->getResult());
```

### Ruby

```bash
gem install slack-apimatic-sdk
```

```ruby
require 'slack_apimatic_sdk'

client = SlackApimaticSdk::Client.new(
  token: ENV['SLACK_BOT_TOKEN']
)

response = client.chat.post_message(
  channel: '#general',
  text:    'Hello from my first Slack app! :wave:'
)

puts response.data
```

### cURL

```bash
curl -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "#general",
    "text": "Hello from my first Slack app! :wave:"
  }'
```

---

## What Success Looks Like

Every Slack API response includes an `ok` boolean. A successful post returns:

```json
{
  "ok": true,
  "channel": "C0123456789",
  "ts": "1735689600.000100",
  "message": {
    "text": "Hello from my first Slack app! :wave:",
    "user": "U0123456789",
    "bot_id": "B0123456789",
    "type": "message"
  }
}
```

Check Slack — your message is in the channel.

---

## Common First-Call Errors

---

## What's Next
