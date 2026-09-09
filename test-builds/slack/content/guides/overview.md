# Build with the Slack Web API

> **Make your first Slack API call in under 5 minutes.**
> Post messages, create bots, automate workflows, and ship integrations that live inside the place teams already work.

The Slack Web API is the fastest way to bring your product into a Slack workspace — send messages, react to events, build slash commands, automate routine work, and surface your data exactly where teams collaborate. This portal gives you everything you need to go from zero to a working integration.

---

## Get Started in Seconds

<CardGroup cols={2}>
<Card title="Get API Credentials" icon="KeyRound" url="page:guides/get-api-credentials">
Create a Slack App, pick your scopes, and grab the bot token you need to authenticate every call.
</Card>
<Card title="Make Your First API Call" icon="Rocket" url="page:guides/quickstart">
Follow the 5-minute quickstart: install an SDK, post a message, and verify the response.
</Card>
<Card title="View SDKs" icon="FileBox" url="page:guides/sdk-setup">
Production-ready client libraries for TypeScript, Python, Java, C#, PHP, Ruby, and Go.
</Card>
<Card title="Open API Reference" icon="BookOpenText" url="page:endpoints">
Browse every endpoint, test calls live in your browser, and copy ready-to-paste code samples.
</Card>
</CardGroup>

---





## Build for Slack

Whether you're shipping a focused bot, automating a multi-step process, or pushing alerts from another system, the Slack API gives you the primitives.

<CardGroup cols={3}>
<Card title="Workflows" icon="Workflow" url="page:guides/workflows">
Automate routine work with custom workflow steps, triggers, and connector functions that fit into Workflow Builder.
</Card>
<Card title="Bots" icon="Bot" url="page:guides/bots">
Listen for events, respond to slash commands, and hold real conversations with users in channels and DMs.
</Card>
<Card title="Integrations" icon="Plug" url="page:guides/integrations">
Push alerts via incoming webhooks, sync data with external systems, and distribute your app on the Slack Marketplace.
</Card>
</CardGroup>

---

## Your Learning Path

A logical progression from "what is this?" to shipping in production.

<CardGroup cols={2}>
<Card title="1. Getting Started" icon="Flag" url="page:guides/quickstart">
**Manuals.** Set up credentials, install an SDK, and make your first call.
</Card>
<Card title="2. Build for Slack" icon="GraduationCap" url="page:guides/workflows">
**Educational.** Learn the platform — workflows, bots, integrations, and the patterns Slack apps share.
</Card>
<Card title="3. API Recipes" icon="ChefHat" url="page:recipes/PostedMessageWithThreadReplyFlow">
**Development resources.** Step-by-step recipes for the most common implementation flows.
</Card>
<Card title="4. API Reference" icon="BookOpenText" url="page:endpoints">
**Technical documentation.** Every endpoint, parameter, and response — testable live in the playground.
</Card>
</CardGroup>

---

## What This Portal Gives You

<CardGroup cols={2}>
<Card title="SDK & API Documentation" icon="BookOpenText">
Reference docs with language-specific guides and SDK walkthroughs. Explore the API surface before you write any code.
</Card>
<Card title="Live API Playground" icon="ArrowBigUpDash">
A built-in console for every endpoint. Authenticate, send real requests, and inspect actual responses without leaving the page.
</Card>
<Card title="Multi-Language SDKs" icon="FileBox">
Production-ready clients in TypeScript, Python, Java, C#, PHP, and Ruby — each with idiomatic code samples and full reference docs.
</Card>
<Card title="API Recipes" icon="Palette">
Step-by-step onboarding flows for the most common Slack patterns: posting in threads, DMing users, building onboarding bots.
</Card>
<Card title="AI Integration Ready" icon="TextSearch">
Auto-generated `llms.txt` makes this portal discoverable to Cursor, Claude Code, and ChatGPT. A built-in copilot answers questions from your docs.
</Card>
<Card title="Sample App" icon="Github" url="page:sample-app/analytics">
A fully working Slack Analytics Dashboard built end-to-end with the SDK — clone it, run it, learn from it.
</Card>
</CardGroup>

---

## Frequently Asked Questions

<AccordionGroup>

<Accordion title="How long does it take to make my first API call?">
Under 5 minutes if you already have a Slack workspace. The [quickstart](page:guides/quickstart) walks through creating an app, installing the SDK, and posting your first message end-to-end.
</Accordion>

<Accordion title="Do I need to build a full Slack App to use the API?">
No. For simple use cases like posting alerts from a CI system, an [incoming webhook](page:guides/integrations) is the lightest path. For anything interactive — bots, slash commands, workflows — you'll want a full app so you can hold scopes and tokens.
</Accordion>

<Accordion title="Which token type should I use?">
For most integrations, the **Bot User OAuth Token** (`xoxb-`) is the right default. Use a **User Token** (`xoxp-`) only when you must act on behalf of a specific user. The [credentials guide](page:guides/get-api-credentials) covers the tradeoffs.
</Accordion>

<Accordion title="What's the difference between the Web API and Events API?">
The **Web API** is request-driven — you call it to do things (post a message, create a channel, look up a user). The **Events API** is push-driven — Slack calls your server when something happens. Most full apps use both. The [bots guide](page:guides/bots) shows how they fit together.
</Accordion>

<Accordion title="Are the SDKs production-ready?">
Yes. Each SDK is generated from the same OpenAPI spec, includes retries and proper error handling, and follows the conventions of its language ecosystem. See [SDK setup](page:guides/sdk-setup) for installation and a first call in your language.
</Accordion>

<Accordion title="How do I test API calls without writing code?">
Every endpoint in the [API Reference](page:endpoints) ships with a **live playground** — paste your token, fill in the parameters, and see the real response. No setup, no sandbox.
</Accordion>

</AccordionGroup>