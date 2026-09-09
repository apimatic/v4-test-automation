export default function SendADirectMessage(workflowCtx, portal) {
  return {
    "Step 1": {
      name: "Getting Started",
      stepCallback: async () => {
        return workflowCtx.showContent(
          "## Introduction\n\nWelcome to this API Recipe, where we'll walk you through how to send a direct message to any user in your Slack workspace using just their email address. This recipe demonstrates a common workflow for reaching out to users without needing \nto know their Slack User ID upfront.\n\n## Details\nDuring this walkthrough, we'll be utilizing three key endpoints to achieve our goal:\n\n1. **[Users Lookup by Email]($e/users/users_lookupByEmail):** This endpoint allows us to find a user in the workspace by providing their email address — essential for identifying who we want to message.\n2. **[Conversations Open]($e/conversations/conversations_open):** Once we've identified the user, we'll use this endpoint to open or resume a direct message conversation with them. This step requires passing the User ID obtained from the previous endpoint.\n3. **[Chat Post Message]($e/chat/chat_postMessage):** With the DM channel now open, we'll use this endpoint to send a message to the user. This step requires passing the Channel ID obtained from the previous endpoint.\n\n **Note:** For this API Recipe, we'll automatically pass the User ID from Step 1 into Step 2, and the Channel ID from Step 2 into Step 3. However, you can update these values manually if needed.\nBy following this API Recipe, you'll gain a clear understanding of how to send direct messages to any user in your workspace using their email address as the starting point. Let's dive in!",
        );
      },
    },
    "Step 2": {
      name: "Users Lookup by Email",
      stepCallback: async () => {
        return workflowCtx.showEndpoint({
          description: "Find a user with an email address",
          endpointPermalink: "$e/users/users_lookupByEmail",
          verify: (response, setError) => {
            if (response.StatusCode == 200) {
              return true;
            } else {
              setError(
                "API Call wasn't able to get a valid response. Please try again.",
              );
              return false;
            }
          },
        });
      },
    },
    "Step 3": {
      name: "Open Conversation",
      stepCallback: async () => {
        return workflowCtx.showEndpoint({
          description: "Opens a conversation",
          endpointPermalink: "$e/conversations/conversations_open",
          verify: (response, setError) => {
            if (response.StatusCode == 200) {
              return true;
            } else {
              setError(
                "API Call wasn't able to get a valid response. Please try again.",
              );
              return false;
            }
          },
        });
      },
    },
    "Step 4": {
      name: "Direct Message",
      stepCallback: async () => {
        return workflowCtx.showEndpoint({
          description: "Sends a message to a channel/user",
          endpointPermalink: "$e/chat/chat_postMessage",
          verify: (response, setError) => {
            if (response.StatusCode == 200) {
              return true;
            } else {
              setError(
                "API Call wasn't able to get a valid response. Please try again.",
              );
              return false;
            }
          },
        });
      },
    },
  };
}
