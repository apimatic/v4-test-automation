# Installing the APIMatic Slack MCP Server in Claude Desktop (Sample MCP)

<Callout type="info">
  This MCP server integration is for demonstration purposes on this sample API Portal.
</Callout>

The APIMatic Slack MCP Server is generated from the Slack Web API OpenAPI spec and hosted by APIMatic — it exposes channel and messaging management as tools Claude can call directly. This guide walks through adding it to Claude Desktop as a **Custom MCP** connector.

## Prerequisites

- Claude Desktop (latest version), with Developer Mode enabled under **Settings → Developer**
- A Slack workspace connected to this portal
- Your **Bot User OAuth Token** and **Workspace ID**, available from your Slack workspace's app configuration

## Server Details

| Field | Value |
|---|---|
| Server name | `apimatic-slack-mcp` |
| Transport | Streamable HTTP |
| Endpoint | `https://mcp.developer.apimatic.io/slack/v1/sse` |
| Auth type | OAuth 2.1 (PKCE) |

## Installation Steps

1. Open Claude Desktop and go to **Settings → Connectors**.
2. Click **Add Custom Connector**.

How to Add custom connector

3. Enter the following:
   - **Name:** `APIMatic Slack MCP`
   - **URL:** `https://mcp.developer.apimatic.io/slack/v1/sse`
4. Click **Connect**. You'll be redirected to a login page — authenticate with your Slack-connected workspace credentials and approve the requested scopes:
   - `channels:read`
   - `channels:manage`
   - `chat:write`
   - `chat:write.customize`
5. Once authorized, Claude Desktop will return to the app and the connector will show a green **Connected** status.
6. Confirm the tools are available by asking Claude something like:
   > "Using the Slack MCP server, list my active channels."

## Available Tools

| Tool | Description |
|---|---|
| `create_channel` | Create a new channel in the workspace |
| `get_channel` | Get one channel by ID |
| `update_channel` | Update an existing channel, e.g. renaming it or changing its topic |
| `list_channels` | List channels with pagination and optional archived-status filtering |
| `archive_channel` | Archive an existing channel by ID |
| `unarchive_channel` | Unarchive a previously archived channel |
| `send_message` | Post a new message to a channel |
| `get_message` | Get one message by channel and timestamp |
| `list_messages` | List messages in a channel with pagination and optional date-range filtering |
| `update_message` | Edit the text of an existing message |
| `delete_message` | Delete an existing message by channel and timestamp |

## Troubleshooting

- **Connector shows "Unauthorized":** Re-check that your Bot User OAuth Token is active and the correct scopes were approved during OAuth.
- **Tools not appearing:** Restart Claude Desktop after connecting; tool lists refresh on launch.
- **Timeouts:** The MCP endpoint may take a few seconds to warm up on first connection — retry after 30 seconds.