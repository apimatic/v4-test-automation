# Slack Channel Analytics [Vibe Coded]

<Callout type="success">
    This application was generated using the Slack [Context Plugin for Claude Code](https://slack-poc-apimatic.pages.dev/#/typescript/sample-app/slack-analytics-dashboard-vibe-coded?ide=claudeCode&isContextPlugin=true).
</Callout>

A real-time Slack workspace analytics tool that scans channels, analyzes message activity, identifies top contributors, and delivers rich reports — both as a Block Kit message posted to Slack and as an interactive Chart.js dashboard in your browser.

**Slack Channel Analytics** is a demonstration application that showcases how a fully functional, API-powered app can be generated using **APIMATIC Context Plugins** with a single command.

---

![Slack Sample App](../static/images/slacksampleapp.gif)

---

## Key Features
- **Full Workspace Scan** — Automatically discovers all public and private channels with cursor-based pagination
- **Message History Analysis** — Fetches message history for configurable periods (1–365 days) and aggregates activity metrics
- **Top Contributors Ranking** — Resolves user IDs to display names and ranks the most active members
- **Activity Heatmap** — Generates a day-of-week vs. hour-of-day visualization showing peak workspace activity
- **Dead Channel Detection** — Identifies inactive channels to help clean up your workspace
- **Slack Block Kit Report** — Posts beautifully formatted reports directly to Slack with emoji heatmaps and bar charts
- **Interactive Browser Dashboard** — Serves a Chart.js-powered HTML dashboard with interactive visualizations
- **Rate Limit Handling** — Automatically respects Slack's API rate limits with graceful backoff

---

<CardGroup cols={1}>
    <Card title="Source Code" icon="Github" url="https://github.com/apimatic/slack-sample-app">
        You can view the complete source code here
    </Card>
</CardGroup>