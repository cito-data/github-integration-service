import { SlackConversationInfo } from "../value-types/slack-conversation-info";

export interface SlackMessageConfig {
  anomalyMessagePart: string,
  occuredOn: string,
  alertId: string,
  testType: string,
  summaryPart: string,
  expectedRangePart: string,
  detectedValuePart: string,
}

export interface ISlackApiRepo {
  sendAlert(
    accessToken: string,
    channelName: string,
    messageProps: SlackMessageConfig,
  ): Promise<void>;
  getConversations(accessToken: string): Promise<SlackConversationInfo[]>;
  joinConversation(accessToken: string, channelId: string): Promise<void>;
  leaveConversation(accessToken: string, channelId: string): Promise<void>;
}
