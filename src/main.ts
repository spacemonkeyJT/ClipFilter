import { Firebot } from "@crowbartools/firebot-custom-scripts-types";

interface Params {
  message: string;
}

const script: Firebot.CustomScript<Params> = {
  getScriptManifest: () => {
    return {
      name: "ClipFilter",
      description: "",
      author: "SpaceMonkeyJT",
      version: "1.0",
      firebotVersion: "5",
    };
  },
  getDefaultParameters: () => {
    return {
      message: {
        type: "string",
        default: "You may only post clips from this channel.",
        description: "Chat message when link is deleted",
      },
    };
  },
  run: async (runRequest) => {
    const messageParam = runRequest.parameters.message;
    const { twitchChat, logger } = runRequest.modules;
    const { username, eventData } = runRequest.trigger.metadata;
    const broadcasterId = runRequest.firebot.accounts.streamer.userId;

    const message = eventData?.messageText as string | undefined;

    const match = /^https:\/\/clips\.twitch\.tv\/(.*)$/i.exec(message);

    if (match) {
      const twitchUserRoles = eventData?.twitchUserRoles as string[] | undefined;
      if (twitchUserRoles.includes('broadcaster') || twitchUserRoles.includes('mod') || twitchUserRoles.includes('vip')) {
        return;
      }

      const clipID = match[1];
      const apiClient = runRequest.modules.twitchApi.getClient();
      logger.info(twitchUserRoles.join(','));
      const clip = await apiClient.clips.getClipById(clipID);

      if (!clip || clip.broadcasterId !== broadcasterId) {
        if (messageParam) {
          twitchChat.sendChatMessage(`@${username} ${messageParam}`, undefined, 'streamer');
        }

        return {
          success: true,
          errorMessage: 'delete',
          effects: [{
            type: "firebot:delete-chat-message"
          }]
        } as any;
      }
    }
  },
};

export default script;
