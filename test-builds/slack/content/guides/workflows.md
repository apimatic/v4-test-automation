

> **Workflows turn routine work into a few clicks.** Anyone in a workspace can build a workflow in Workflow Builder — your job, as an API developer, is to give them powerful *custom steps* and *triggers* they can drop into those workflows.

A workflow is a sequence of automated actions in Slack. It starts with a **trigger** (a message shortcut, a scheduled time, a webhook from an external system) and runs a series of **steps** (post a message, open a form, call an external service, fork on a condition).

Custom workflow steps and triggers are what let your API show up natively inside other people's automations.

---

## When to Build a Workflow

---

## The Three Building Blocks

---

## Quickstart: Trigger a Workflow from Code

The simplest custom workflow integration is a **webhook trigger** — your code posts JSON to a Slack URL and a workflow runs.

### 1. Create the trigger in Workflow Builder

In your workspace, open **Workflow Builder** → **New Workflow** → start from a **webhook** trigger. Slack gives you a URL like:

```
https://hooks.slack.com/triggers/T0123/4567/abc...
```

### 2. Define the inputs

Add the variables your trigger will accept (e.g., `incident_id`, `severity`, `summary`). These become available to every downstream step.

### 3. Fire it from your code
```bash
curl -X POST "$SLACK_TRIGGER_URL" \
  -H "Content-Type: application/json" \
  --data '{
    "incident_id": "INC-4821",
    "severity":    "high",
    "summary":     "Checkout latency spiked to 12s"
  }'
```

```typescript
await fetch(process.env.SLACK_TRIGGER_URL!, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    incident_id: 'INC-4821',
    severity: 'high',
    summary: 'Checkout latency spiked to 12s',
  }),
});
```

```python
import os, requests

requests.post(
    os.environ['SLACK_TRIGGER_URL'],
    json={
        'incident_id': 'INC-4821',
        'severity':    'high',
        'summary':     'Checkout latency spiked to 12s',
    },
)
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String payload = """
    {
      "incident_id": "INC-4821",
      "severity":    "high",
      "summary":     "Checkout latency spiked to 12s"
    }
    """;

HttpClient.newHttpClient().send(
    HttpRequest.newBuilder()
        .uri(URI.create(System.getenv("SLACK_TRIGGER_URL")))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(payload))
        .build(),
    HttpResponse.BodyHandlers.ofString());
```

```csharp
using System.Net.Http;
using System.Net.Http.Json;

var http = new HttpClient();
await http.PostAsJsonAsync(
    Environment.GetEnvironmentVariable("SLACK_TRIGGER_URL"),
    new
    {
        incident_id = "INC-4821",
        severity    = "high",
        summary     = "Checkout latency spiked to 12s",
    });
```

```php
$ch = curl_init(getenv('SLACK_TRIGGER_URL'));
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode([
        'incident_id' => 'INC-4821',
        'severity'    => 'high',
        'summary'     => 'Checkout latency spiked to 12s',
    ]),
    CURLOPT_RETURNTRANSFER => true,
]);
curl_exec($ch);
curl_close($ch);
```

```ruby
require 'net/http'
require 'json'
require 'uri'

Net::HTTP.post(
  URI(ENV['SLACK_TRIGGER_URL']),
  {
    incident_id: 'INC-4821',
    severity:    'high',
    summary:     'Checkout latency spiked to 12s',
  }.to_json,
  'Content-Type' => 'application/json',
)
```

The workflow runs every time you POST — opening an incident channel, paging the on-call, posting a status — without any code on the Slack side beyond what you dragged into Workflow Builder.

---

## Publishing Custom Steps for Workflow Builder

Once you have an SDK installed, you can publish **custom functions** that appear as draggable steps inside Workflow Builder. The pattern is:

A minimal custom step declares its inputs, outputs, and handler. The shape is the same across languages — what changes is how you express the schema.
```typescript
import { DefineFunction, Schema } from 'slack-apimatic-sdk/workflows';

export const CreateTicketFunction = DefineFunction({
  callback_id: 'create_ticket',
  title: 'Create Support Ticket',
  source_file: 'functions/create_ticket.ts',
  input_parameters: {
    properties: {
      subject:  { type: Schema.types.string },
      reporter: { type: Schema.slack.types.user_id },
      priority: {
        type: Schema.types.string,
        enum: ['low', 'medium', 'high', 'urgent'],
      },
    },
    required: ['subject', 'reporter', 'priority'],
  },
  output_parameters: {
    properties: {
      ticket_id:  { type: Schema.types.string },
      ticket_url: { type: Schema.types.string },
    },
    required: ['ticket_id', 'ticket_url'],
  },
});
```

```python
from slackapimaticsdk.workflows import DefineFunction, Schema

CreateTicketFunction = DefineFunction(
    callback_id = 'create_ticket',
    title       = 'Create Support Ticket',
    source_file = 'functions/create_ticket.py',
    input_parameters = {
        'properties': {
            'subject':  {'type': Schema.types.string},
            'reporter': {'type': Schema.slack.types.user_id},
            'priority': {
                'type': Schema.types.string,
                'enum': ['low', 'medium', 'high', 'urgent'],
            },
        },
        'required': ['subject', 'reporter', 'priority'],
    },
    output_parameters = {
        'properties': {
            'ticket_id':  {'type': Schema.types.string},
            'ticket_url': {'type': Schema.types.string},
        },
        'required': ['ticket_id', 'ticket_url'],
    },
)
```

```java
import io.sdks.slack.workflows.DefineFunction;
import io.sdks.slack.workflows.Schema;

public static final DefineFunction CREATE_TICKET = DefineFunction.builder()
    .callbackId("create_ticket")
    .title("Create Support Ticket")
    .sourceFile("functions/CreateTicket.java")
    .inputParameters(Map.of(
        "properties", Map.of(
            "subject",  Map.of("type", Schema.types.STRING),
            "reporter", Map.of("type", Schema.slack.types.USER_ID),
            "priority", Map.of(
                "type", Schema.types.STRING,
                "enum", List.of("low", "medium", "high", "urgent"))),
        "required", List.of("subject", "reporter", "priority")))
    .outputParameters(Map.of(
        "properties", Map.of(
            "ticket_id",  Map.of("type", Schema.types.STRING),
            "ticket_url", Map.of("type", Schema.types.STRING)),
        "required", List.of("ticket_id", "ticket_url")))
    .build();
```

```csharp
using SlackApimaticSdk.Workflows;

public static readonly DefineFunction CreateTicketFunction = new DefineFunction
{
    CallbackId = "create_ticket",
    Title      = "Create Support Ticket",
    SourceFile = "Functions/CreateTicket.cs",
    InputParameters = new
    {
        properties = new
        {
            subject  = new { type = Schema.Types.String },
            reporter = new { type = Schema.Slack.Types.UserId },
            priority = new
            {
                type = Schema.Types.String,
                @enum = new[] { "low", "medium", "high", "urgent" },
            },
        },
        required = new[] { "subject", "reporter", "priority" },
    },
    OutputParameters = new
    {
        properties = new
        {
            ticket_id  = new { type = Schema.Types.String },
            ticket_url = new { type = Schema.Types.String },
        },
        required = new[] { "ticket_id", "ticket_url" },
    },
};
```

```php
use SlackApimaticSdk\Workflows\DefineFunction;
use SlackApimaticSdk\Workflows\Schema;

$CreateTicketFunction = DefineFunction::create([
    'callback_id' => 'create_ticket',
    'title'       => 'Create Support Ticket',
    'source_file' => 'functions/create_ticket.php',
    'input_parameters' => [
        'properties' => [
            'subject'  => ['type' => Schema::types()->string],
            'reporter' => ['type' => Schema::slack()->types()->user_id],
            'priority' => [
                'type' => Schema::types()->string,
                'enum' => ['low', 'medium', 'high', 'urgent'],
            ],
        ],
        'required' => ['subject', 'reporter', 'priority'],
    ],
    'output_parameters' => [
        'properties' => [
            'ticket_id'  => ['type' => Schema::types()->string],
            'ticket_url' => ['type' => Schema::types()->string],
        ],
        'required' => ['ticket_id', 'ticket_url'],
    ],
]);
```

```ruby
require 'slack_apimatic_sdk/workflows'

CreateTicketFunction = SlackApimaticSdk::Workflows::DefineFunction.new(
  callback_id: 'create_ticket',
  title:       'Create Support Ticket',
  source_file: 'functions/create_ticket.rb',
  input_parameters: {
    properties: {
      subject:  { type: Schema.types.string },
      reporter: { type: Schema.slack.types.user_id },
      priority: {
        type: Schema.types.string,
        enum: %w[low medium high urgent],
      },
    },
    required: %i[subject reporter priority],
  },
  output_parameters: {
    properties: {
      ticket_id:  { type: Schema.types.string },
      ticket_url: { type: Schema.types.string },
    },
    required: %i[ticket_id ticket_url],
  },
)
```

```bash
# Custom functions are authored with one of the SDKs above and deployed via the
# Slack CLI — there is no raw HTTP form for declaring a function. Once deployed,
# Slack invokes your function over the Events API:

POST /slack/events HTTP/1.1
Content-Type: application/json

{
  "type": "event_callback",
  "event": {
    "type":        "function_executed",
    "function": {
      "callback_id": "create_ticket"
    },
    "inputs": {
      "subject":  "Login button is broken",
      "reporter": "U0456",
      "priority": "high"
    },
    "function_execution_id": "Fx0123ABC"
  }
}

# Your function returns outputs via functions.completeSuccess:
curl -X POST "https://slack.com/api/functions.completeSuccess" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "function_execution_id": "Fx0123ABC",
    "outputs": {
      "ticket_id":  "TKT-9876",
      "ticket_url": "https://help.example.com/tickets/9876"
    }
  }'
```

The handler implements the business logic — call your backend, return the ticket ID and URL — and Slack handles input collection, output passing, and error display.

---

## Patterns That Work Well

---

## Workflows vs. Bots vs. Webhooks

---

## Next Steps
