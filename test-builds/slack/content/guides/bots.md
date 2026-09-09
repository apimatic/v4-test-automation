

> **A bot listens, decides, and responds.** Where [workflows](page:guides/workflows) are linear and user-assembled, a bot is conversational, stateful, and lives wherever your users do — in channels, in DMs, in threads.

A Slack bot is a Slack App with two halves wired together:

1. **It receives events** — messages, mentions, button clicks, slash commands — pushed to your server by Slack's Events API.
2. **It calls the Web API** — to post replies, open modals, update messages, or take action in other systems.

This guide covers how those two halves fit together and the patterns that show up in almost every production bot.

---

## What Bots Are Good At

---

## The Bot Anatomy

---

## Pattern 1 — Respond to a Mention

The classic starter bot: someone @-mentions the app, the bot replies in-thread.
```typescript
import express from 'express';
import { Client } from 'slack-apimatic-sdk';

const app = express();
app.use(express.json());

const slack = new Client({ token: process.env.SLACK_BOT_TOKEN! });

app.post('/slack/events', async (req, res) => {
  // URL verification handshake (first-time only)
  if (req.body.type === 'url_verification') {
    return res.json({ challenge: req.body.challenge });
  }

  const event = req.body.event;
  if (event?.type === 'app_mention') {
    await slack.chatController.postMessage({
      channel:   event.channel,
      thread_ts: event.ts,
      text:      `Hey <@${event.user}> — what can I help with?`,
    });
  }

  res.sendStatus(200);
});

app.listen(3000);
```

```python
import os
from flask import Flask, request, jsonify
from slackapimaticsdk.client import Client

app   = Flask(__name__)
slack = Client(token=os.environ['SLACK_BOT_TOKEN'])

@app.post('/slack/events')
def events():
    body = request.get_json()

    # URL verification handshake (first-time only)
    if body.get('type') == 'url_verification':
        return jsonify({'challenge': body['challenge']})

    event = body.get('event', {})
    if event.get('type') == 'app_mention':
        slack.chat.post_message(
            channel   = event['channel'],
            thread_ts = event['ts'],
            text      = f"Hey <@{event['user']}> — what can I help with?",
        )

    return '', 200

if __name__ == '__main__':
    app.run(port=3000)
```

```java
import io.sdks.slack.SlackClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class SlackEventsController {

  private final SlackClient slack = new SlackClient.Builder()
      .token(System.getenv("SLACK_BOT_TOKEN"))
      .build();

  @PostMapping("/slack/events")
  public Object events(@RequestBody Map<String, Object> body) throws Exception {
    // URL verification handshake (first-time only)
    if ("url_verification".equals(body.get("type"))) {
      return Map.of("challenge", body.get("challenge"));
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> event = (Map<String, Object>) body.get("event");
    if (event != null && "app_mention".equals(event.get("type"))) {
      slack.getChatController().postMessage(
          (String) event.get("channel"),
          "Hey <@" + event.get("user") + "> — what can I help with?"
      );
    }

    return "";
  }
}
```

```csharp
using SlackApimaticSdk;
using System.Text.Json;

var slack = new SlackClient.Builder()
    .Token(Environment.GetEnvironmentVariable("SLACK_BOT_TOKEN"))
    .Build();

app.MapPost("/slack/events", async (JsonElement body) =>
{
    // URL verification handshake (first-time only)
    if (body.GetProperty("type").GetString() == "url_verification")
    {
        return Results.Ok(new { challenge = body.GetProperty("challenge").GetString() });
    }

    var evt = body.GetProperty("event");
    if (evt.GetProperty("type").GetString() == "app_mention")
    {
        await slack.ChatController.PostMessageAsync(
            channel:  evt.GetProperty("channel").GetString(),
            threadTs: evt.GetProperty("ts").GetString(),
            text:     $"Hey <@{evt.GetProperty("user").GetString()}> — what can I help with?");
    }

    return Results.Ok();
});

app.Run();
```

```php
use Slim\Factory\AppFactory;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface     as Response;
use SlackApimaticSdk\SlackClientBuilder;

$slack = SlackClientBuilder::init()
    ->token(getenv('SLACK_BOT_TOKEN'))
    ->build();

$app = AppFactory::create();

$app->post('/slack/events', function (Request $req, Response $res) use ($slack) {
    $body = json_decode((string) $req->getBody(), true);

    // URL verification handshake (first-time only)
    if (($body['type'] ?? null) === 'url_verification') {
        $res->getBody()->write(json_encode(['challenge' => $body['challenge']]));
        return $res->withHeader('Content-Type', 'application/json');
    }

    $event = $body['event'] ?? [];
    if (($event['type'] ?? null) === 'app_mention') {
        $slack->getChatController()->postMessage([
            'channel'   => $event['channel'],
            'thread_ts' => $event['ts'],
            'text'      => "Hey <@{$event['user']}> — what can I help with?",
        ]);
    }

    return $res->withStatus(200);
});

$app->run();
```

```ruby
require 'sinatra'
require 'json'
require 'slack_apimatic_sdk'

slack = SlackApimaticSdk::Client.new(token: ENV['SLACK_BOT_TOKEN'])

post '/slack/events' do
  body = JSON.parse(request.body.read)

  # URL verification handshake (first-time only)
  if body['type'] == 'url_verification'
    content_type :json
    return { challenge: body['challenge'] }.to_json
  end

  event = body['event']
  if event && event['type'] == 'app_mention'
    slack.chat.post_message(
      channel:   event['channel'],
      thread_ts: event['ts'],
      text:      "Hey <@#{event['user']}> — what can I help with?",
    )
  end

  status 200
  ''
end
```

```bash
# Slack POSTs this JSON to your /slack/events endpoint when someone @-mentions your app.
# Your server has 3 seconds to respond with 2xx.

POST /slack/events HTTP/1.1
Host: your-server.example.com
Content-Type: application/json
X-Slack-Signature: v0=...
X-Slack-Request-Timestamp: 1735689600

{
  "type": "event_callback",
  "team_id": "T0123",
  "event": {
    "type":    "app_mention",
    "user":    "U0456",
    "text":    "<@U0BOT> hello",
    "ts":      "1735689600.000100",
    "channel": "C0789"
  }
}

# Reply by calling chat.postMessage:
curl -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"channel":"C0789","thread_ts":"1735689600.000100","text":"Hey <@U0456> — what can I help with?"}'
```

A few things to notice:

- **The `url_verification` handshake** runs once when you first add the events endpoint. Echo back the `challenge` so Slack marks the URL verified.
- **Always respond with 2xx in under 3 seconds.** Do real work *after* sending the response — Slack retries delivery if you're slow, and your bot will fire twice.
- **Thread your replies.** Setting `thread_ts` keeps channels readable.

---

## Pattern 2 — Slash Commands

Slash commands are the fastest way to give users a verb. Register `/deploy` in your app's **Slash Commands** settings and point it at your server.
```typescript
import express from 'express';

const app = express();
app.use(express.urlencoded({ extended: true }));

app.post('/slack/commands/deploy', async (req, res) => {
  const userId = req.body.user_id as string;
  const target = ((req.body.text as string) || '').trim() || 'staging';

  // Ack within 3 seconds — do the deploy asynchronously.
  enqueueDeploy({ user: userId, target });

  res.json({
    response_type: 'in_channel',
    text:          `:rocket: Deploying to *${target}* — kicked off by <@${userId}>.`,
  });
});
```

```python
from flask import Flask, request, jsonify
from slackapimaticsdk.client import Client
import os

app   = Flask(__name__)
slack = Client(token=os.environ['SLACK_BOT_TOKEN'])

@app.post('/slack/commands/deploy')
def deploy():
    user_id = request.form['user_id']
    target  = request.form['text'].strip() or 'staging'

    # Ack within 3 seconds — do the deploy asynchronously.
    enqueue_deploy(user=user_id, target=target)

    return jsonify({
        'response_type': 'in_channel',
        'text':          f':rocket: Deploying to *{target}* — kicked off by <@{user_id}>.',
    })
```

```java
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class DeployCommandController {

  @PostMapping(
      value    = "/slack/commands/deploy",
      consumes = "application/x-www-form-urlencoded")
  public Map<String, String> deploy(
      @RequestParam("user_id") String userId,
      @RequestParam(value = "text", required = false) String text) {

    String target = (text == null || text.isBlank()) ? "staging" : text.trim();

    // Ack within 3 seconds — do the deploy asynchronously.
    enqueueDeploy(userId, target);

    return Map.of(
        "response_type", "in_channel",
        "text",          ":rocket: Deploying to *" + target + "* — kicked off by <@" + userId + ">."
    );
  }
}
```

```csharp
app.MapPost("/slack/commands/deploy", async (HttpRequest req) =>
{
    var form   = await req.ReadFormAsync();
    var userId = form["user_id"].ToString();
    var target = string.IsNullOrWhiteSpace(form["text"])
                   ? "staging"
                   : form["text"].ToString().Trim();

    // Ack within 3 seconds — do the deploy asynchronously.
    EnqueueDeploy(userId, target);

    return Results.Ok(new
    {
        response_type = "in_channel",
        text          = $":rocket: Deploying to *{target}* — kicked off by <@{userId}>."
    });
});
```

```php
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface     as Response;

$app->post('/slack/commands/deploy', function (Request $req, Response $res) {
    $params  = $req->getParsedBody();
    $userId  = $params['user_id'];
    $target  = trim($params['text'] ?? '') ?: 'staging';

    // Ack within 3 seconds — do the deploy asynchronously.
    enqueueDeploy($userId, $target);

    $res->getBody()->write(json_encode([
        'response_type' => 'in_channel',
        'text'          => ":rocket: Deploying to *{$target}* — kicked off by <@{$userId}>.",
    ]));
    return $res->withHeader('Content-Type', 'application/json');
});
```

```ruby
require 'sinatra'
require 'json'

post '/slack/commands/deploy' do
  user_id = params[:user_id]
  target  = (params[:text] || '').strip
  target  = 'staging' if target.empty?

  # Ack within 3 seconds — do the deploy asynchronously.
  enqueue_deploy(user: user_id, target: target)

  content_type :json
  { response_type: 'in_channel',
    text:          ":rocket: Deploying to *#{target}* — kicked off by <@#{user_id}>." }.to_json
end
```

```bash
# Slack POSTs this form payload when a user runs /deploy <args>.
# Reply with JSON in the response body within 3 seconds.

POST /slack/commands/deploy HTTP/1.1
Host: your-server.example.com
Content-Type: application/x-www-form-urlencoded

token=verification_token&team_id=T0123&channel_id=C0789&user_id=U0456&command=%2Fdeploy&text=staging&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2F...

# Response your server returns:
HTTP/1.1 200 OK
Content-Type: application/json

{
  "response_type": "in_channel",
  "text": ":rocket: Deploying to *staging* — kicked off by <@U0456>."
}
```

- `response_type: 'in_channel'` makes the response visible to everyone (default is `ephemeral`, only visible to the invoker).
- Long-running work belongs in a queue. The HTTP response is your acknowledgement; post follow-ups with `chat.postMessage` or by hitting the `response_url` Slack provides.

---

## Pattern 3 — Interactive Buttons and Modals

Add buttons to a message and Slack POSTs you a payload when the user clicks.
```typescript
// Step 1: Post a message with a button
await slack.chatController.postMessage({
  channel: '#approvals',
  blocks: [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*New expense:* $1,240 — office equipment' },
    },
    {
      type: 'actions',
      elements: [
        { type: 'button', action_id: 'approve', text: { type: 'plain_text', text: 'Approve' }, style: 'primary', value: 'exp_4821' },
        { type: 'button', action_id: 'reject',  text: { type: 'plain_text', text: 'Reject'  }, style: 'danger',  value: 'exp_4821' },
      ],
    },
  ],
});

// Step 2: Handle the click
app.post('/slack/interactions', async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const action  = payload.actions[0];

  if (action.action_id === 'approve') {
    await approveExpense(action.value, payload.user.id);
    await slack.chatController.update({
      channel: payload.channel.id,
      ts:      payload.message.ts,
      text:    `:white_check_mark: Approved by <@${payload.user.id}>`,
    });
  }

  res.sendStatus(200);
});
```

```python
import json
from flask import request

# Step 1: Post a message with a button
slack.chat.post_message(
    channel='#approvals',
    blocks=[
        {'type': 'section',
         'text': {'type': 'mrkdwn', 'text': '*New expense:* $1,240 — office equipment'}},
        {'type': 'actions', 'elements': [
            {'type': 'button', 'action_id': 'approve', 'text': {'type': 'plain_text', 'text': 'Approve'}, 'style': 'primary', 'value': 'exp_4821'},
            {'type': 'button', 'action_id': 'reject',  'text': {'type': 'plain_text', 'text': 'Reject'},  'style': 'danger',  'value': 'exp_4821'},
        ]},
    ],
)

# Step 2: Handle the click
@app.post('/slack/interactions')
def interactions():
    payload = json.loads(request.form['payload'])
    action  = payload['actions'][0]

    if action['action_id'] == 'approve':
        approve_expense(action['value'], payload['user']['id'])
        slack.chat.update(
            channel = payload['channel']['id'],
            ts      = payload['message']['ts'],
            text    = f":white_check_mark: Approved by <@{payload['user']['id']}>",
        )

    return '', 200
```

```java
import com.fasterxml.jackson.databind.*;
import org.springframework.web.bind.annotation.*;

// Step 1: Post a message with a button
String blocks = """
    [
      {"type":"section","text":{"type":"mrkdwn","text":"*New expense:* $1,240 — office equipment"}},
      {"type":"actions","elements":[
        {"type":"button","action_id":"approve","text":{"type":"plain_text","text":"Approve"},"style":"primary","value":"exp_4821"},
        {"type":"button","action_id":"reject", "text":{"type":"plain_text","text":"Reject"}, "style":"danger", "value":"exp_4821"}
      ]}
    ]
    """;
slack.getChatController().postMessage(
    "#approvals",
    /* text= */ "New expense",
    /* blocks= */ blocks);

// Step 2: Handle the click
@PostMapping(value = "/slack/interactions",
             consumes = "application/x-www-form-urlencoded")
public String interactions(@RequestParam("payload") String payloadJson) throws Exception {
  JsonNode payload = new ObjectMapper().readTree(payloadJson);
  JsonNode action  = payload.get("actions").get(0);

  if ("approve".equals(action.get("action_id").asText())) {
    approveExpense(action.get("value").asText(), payload.get("user").get("id").asText());
    slack.getChatController().update(
        payload.get("channel").get("id").asText(),
        payload.get("message").get("ts").asText(),
        ":white_check_mark: Approved by <@" + payload.get("user").get("id").asText() + ">"
    );
  }

  return "";
}
```

```csharp
using System.Text.Json;

// Step 1: Post a message with a button
var blocks = JsonSerializer.Serialize(new object[] {
    new { type = "section",
          text = new { type = "mrkdwn", text = "*New expense:* $1,240 — office equipment" } },
    new { type = "actions", elements = new object[] {
        new { type = "button", action_id = "approve", text = new { type = "plain_text", text = "Approve" }, style = "primary", value = "exp_4821" },
        new { type = "button", action_id = "reject",  text = new { type = "plain_text", text = "Reject"  }, style = "danger",  value = "exp_4821" },
    }},
});
await slack.ChatController.PostMessageAsync(channel: "#approvals", blocks: blocks);

// Step 2: Handle the click
app.MapPost("/slack/interactions", async (HttpRequest req) =>
{
    var form    = await req.ReadFormAsync();
    var payload = JsonDocument.Parse(form["payload"]).RootElement;
    var action  = payload.GetProperty("actions")[0];

    if (action.GetProperty("action_id").GetString() == "approve")
    {
        await ApproveExpenseAsync(action.GetProperty("value").GetString(),
                                   payload.GetProperty("user").GetProperty("id").GetString());
        await slack.ChatController.UpdateAsync(
            channel: payload.GetProperty("channel").GetProperty("id").GetString(),
            ts:      payload.GetProperty("message").GetProperty("ts").GetString(),
            text:    $":white_check_mark: Approved by <@{payload.GetProperty("user").GetProperty("id").GetString()}>");
    }

    return Results.Ok();
});
```

```php
// Step 1: Post a message with a button
$slack->getChatController()->postMessage([
    'channel' => '#approvals',
    'blocks'  => [
        ['type' => 'section',
         'text' => ['type' => 'mrkdwn', 'text' => '*New expense:* $1,240 — office equipment']],
        ['type' => 'actions', 'elements' => [
            ['type' => 'button', 'action_id' => 'approve', 'text' => ['type' => 'plain_text', 'text' => 'Approve'], 'style' => 'primary', 'value' => 'exp_4821'],
            ['type' => 'button', 'action_id' => 'reject',  'text' => ['type' => 'plain_text', 'text' => 'Reject'],  'style' => 'danger',  'value' => 'exp_4821'],
        ]],
    ],
]);

// Step 2: Handle the click
$app->post('/slack/interactions', function (Request $req, Response $res) use ($slack) {
    $payload = json_decode($req->getParsedBody()['payload'], true);
    $action  = $payload['actions'][0];

    if ($action['action_id'] === 'approve') {
        approveExpense($action['value'], $payload['user']['id']);
        $slack->getChatController()->update([
            'channel' => $payload['channel']['id'],
            'ts'      => $payload['message']['ts'],
            'text'    => ":white_check_mark: Approved by <@{$payload['user']['id']}>",
        ]);
    }

    return $res->withStatus(200);
});
```

```ruby
require 'json'

# Step 1: Post a message with a button
slack.chat.post_message(
  channel: '#approvals',
  blocks: [
    { type: 'section',
      text: { type: 'mrkdwn', text: '*New expense:* $1,240 — office equipment' } },
    { type: 'actions', elements: [
      { type: 'button', action_id: 'approve', text: { type: 'plain_text', text: 'Approve' }, style: 'primary', value: 'exp_4821' },
      { type: 'button', action_id: 'reject',  text: { type: 'plain_text', text: 'Reject'  }, style: 'danger',  value: 'exp_4821' },
    ]},
  ],
)

# Step 2: Handle the click
post '/slack/interactions' do
  payload = JSON.parse(params['payload'])
  action  = payload['actions'].first

  if action['action_id'] == 'approve'
    approve_expense(action['value'], payload['user']['id'])
    slack.chat.update(
      channel: payload['channel']['id'],
      ts:      payload['message']['ts'],
      text:    ":white_check_mark: Approved by <@#{payload['user']['id']}>",
    )
  end

  status 200
  ''
end
```

```bash
# Step 1 — Post a message with a button:
curl -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "channel": "#approvals",
    "blocks": [
      {"type":"section","text":{"type":"mrkdwn","text":"*New expense:* $1,240 — office equipment"}},
      {"type":"actions","elements":[
        {"type":"button","action_id":"approve","text":{"type":"plain_text","text":"Approve"},"style":"primary","value":"exp_4821"},
        {"type":"button","action_id":"reject", "text":{"type":"plain_text","text":"Reject"}, "style":"danger", "value":"exp_4821"}
      ]}
    ]
  }'

# Step 2 — Slack POSTs the click to your /slack/interactions endpoint
# (form-encoded, with `payload` containing JSON):

POST /slack/interactions HTTP/1.1
Content-Type: application/x-www-form-urlencoded

payload=%7B%22type%22%3A%22block_actions%22%2C%22user%22%3A%7B%22id%22%3A%22U0456%22%7D%2C%22channel%22%3A%7B%22id%22%3A%22C0789%22%7D%2C%22message%22%3A%7B%22ts%22%3A%221735689600.000100%22%7D%2C%22actions%22%3A%5B%7B%22action_id%22%3A%22approve%22%2C%22value%22%3A%22exp_4821%22%7D%5D%7D

# Then call chat.update to confirm:
curl -X POST "https://slack.com/api/chat.update" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"channel":"C0789","ts":"1735689600.000100","text":":white_check_mark: Approved by <@U0456>"}'
```

For multi-field input — collecting a reason, a date, a dropdown choice — open a **modal** with `views.open` instead of cramming everything into a message.

---

## Pattern 4 — The App Home Tab

The **Home tab** is a personal view of your app that each user sees when they click your bot's name. It's the right place for dashboards, settings, and "what should I do next" surfaces.
```typescript
app.post('/slack/events', async (req, res) => {
  const event = req.body.event;
  if (event?.type === 'app_home_opened' && event.tab === 'home') {
    await slack.viewsController.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: 'Your On-Call Today' } },
          { type: 'section', text: { type: 'mrkdwn', text: '*Primary:* <@U123>\n*Secondary:* <@U456>' } },
          { type: 'actions', elements: [
            { type: 'button', action_id: 'swap', text: { type: 'plain_text', text: 'Swap with someone' } },
          ]},
        ],
      },
    });
  }
  res.sendStatus(200);
});
```

```python
@app.post('/slack/events')
def events():
    event = request.get_json().get('event', {})
    if event.get('type') == 'app_home_opened' and event.get('tab') == 'home':
        slack.views.publish(
            user_id = event['user'],
            view = {
                'type': 'home',
                'blocks': [
                    {'type': 'header',  'text': {'type': 'plain_text', 'text': 'Your On-Call Today'}},
                    {'type': 'section', 'text': {'type': 'mrkdwn',     'text': '*Primary:* <@U123>\n*Secondary:* <@U456>'}},
                    {'type': 'actions', 'elements': [
                        {'type': 'button', 'action_id': 'swap', 'text': {'type': 'plain_text', 'text': 'Swap with someone'}},
                    ]},
                ],
            },
        )
    return '', 200
```

```java
@PostMapping("/slack/events")
public Object homeOpened(@RequestBody Map<String, Object> body) throws Exception {
  @SuppressWarnings("unchecked")
  Map<String, Object> event = (Map<String, Object>) body.get("event");

  if (event != null
      && "app_home_opened".equals(event.get("type"))
      && "home".equals(event.get("tab"))) {

    String view = """
        {
          "type": "home",
          "blocks": [
            {"type":"header", "text":{"type":"plain_text","text":"Your On-Call Today"}},
            {"type":"section","text":{"type":"mrkdwn","text":"*Primary:* <@U123>\\n*Secondary:* <@U456>"}},
            {"type":"actions","elements":[
              {"type":"button","action_id":"swap","text":{"type":"plain_text","text":"Swap with someone"}}
            ]}
          ]
        }
        """;
    slack.getViewsController().publish((String) event.get("user"), view);
  }
  return "";
}
```

```csharp
app.MapPost("/slack/events", async (JsonElement body) =>
{
    var evt = body.GetProperty("event");
    if (evt.GetProperty("type").GetString() == "app_home_opened"
        && evt.GetProperty("tab").GetString() == "home")
    {
        var view = new
        {
            type   = "home",
            blocks = new object[] {
                new { type = "header",  text = new { type = "plain_text", text = "Your On-Call Today" } },
                new { type = "section", text = new { type = "mrkdwn",     text = "*Primary:* <@U123>\n*Secondary:* <@U456>" } },
                new { type = "actions", elements = new object[] {
                    new { type = "button", action_id = "swap", text = new { type = "plain_text", text = "Swap with someone" } },
                }},
            },
        };
        await slack.ViewsController.PublishAsync(
            userId: evt.GetProperty("user").GetString(),
            view:   JsonSerializer.Serialize(view));
    }
    return Results.Ok();
});
```

```php
$app->post('/slack/events', function (Request $req, Response $res) use ($slack) {
    $event = json_decode((string) $req->getBody(), true)['event'] ?? [];

    if (($event['type'] ?? null) === 'app_home_opened' && ($event['tab'] ?? null) === 'home') {
        $slack->getViewsController()->publish([
            'user_id' => $event['user'],
            'view' => [
                'type'   => 'home',
                'blocks' => [
                    ['type' => 'header',  'text' => ['type' => 'plain_text', 'text' => 'Your On-Call Today']],
                    ['type' => 'section', 'text' => ['type' => 'mrkdwn',     'text' => "*Primary:* <@U123>\n*Secondary:* <@U456>"]],
                    ['type' => 'actions', 'elements' => [
                        ['type' => 'button', 'action_id' => 'swap', 'text' => ['type' => 'plain_text', 'text' => 'Swap with someone']],
                    ]],
                ],
            ],
        ]);
    }
    return $res->withStatus(200);
});
```

```ruby
post '/slack/events' do
  event = JSON.parse(request.body.read)['event']
  if event && event['type'] == 'app_home_opened' && event['tab'] == 'home'
    slack.views.publish(
      user_id: event['user'],
      view: {
        type: 'home',
        blocks: [
          { type: 'header',  text: { type: 'plain_text', text: 'Your On-Call Today' } },
          { type: 'section', text: { type: 'mrkdwn',     text: "*Primary:* <@U123>\n*Secondary:* <@U456>" } },
          { type: 'actions', elements: [
            { type: 'button', action_id: 'swap', text: { type: 'plain_text', text: 'Swap with someone' } },
          ]},
        ],
      },
    )
  end
  status 200
  ''
end
```

```bash
# Slack POSTs this event when a user opens your app's Home tab:
POST /slack/events HTTP/1.1
Content-Type: application/json

{
  "type": "event_callback",
  "event": {
    "type": "app_home_opened",
    "user": "U0456",
    "tab":  "home"
  }
}

# Publish the Home view by calling views.publish:
curl -X POST "https://slack.com/api/views.publish" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "user_id": "U0456",
    "view": {
      "type": "home",
      "blocks": [
        {"type":"header","text":{"type":"plain_text","text":"Your On-Call Today"}},
        {"type":"section","text":{"type":"mrkdwn","text":"*Primary:* <@U123>\n*Secondary:* <@U456>"}},
        {"type":"actions","elements":[
          {"type":"button","action_id":"swap","text":{"type":"plain_text","text":"Swap with someone"}}
        ]}
      ]
    }
  }'
```

---

## Production Checklist

---

## Bots vs. Workflows vs. Webhooks

| You need... | Build a... |
|---|---|
| Linear automation users assemble themselves | [Workflow](page:guides/workflows) |
| One-way "post when X happens" alert | [Incoming Webhook](page:guides/integrations) |
| Stateful conversation, buttons, modals, branching logic | **Bot** (this guide) |
| Native step inside someone else's workflow | [Custom function](page:guides/workflows) |

---

## Next Steps
