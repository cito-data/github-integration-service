import { SlackConversationInfo } from "../value-types/slack-conversation-info";

export interface ISlackApiRepo {
  sendAlert(
    accessToken: string,
    channelName: string,
    message: string
  ): Promise<void>;
  getConversations(accessToken: string): Promise<SlackConversationInfo[]>;
}
