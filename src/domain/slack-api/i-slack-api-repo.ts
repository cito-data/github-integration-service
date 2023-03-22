import { SlackConversationInfo } from '../value-types/slack-conversation-info';

export interface QualAlertMsgConfig {
  anomalyMessagePart: string;
  occurredOn: string;
  alertId: string;
  testType: string;
  summaryPart: string;
  detectedValuePart: string;
}

type ThresholdType = 'upper' | 'lower';

export interface QuantAlertMsgConfig {
  anomalyMessagePart: string;
  occurredOn: string;
  alertId: string;
  testType: string;
  summaryPart: string;
  expectedRangePart: string;
  detectedValuePart: string;
  detectedValue: number;
  thresholdType: ThresholdType;
  testSuiteId: string;
  imageUrl: string;
}

export interface ISlackApiRepo {
  sendQualAlert(
    accessToken: string,
    channelName: string,
    messageProps: QualAlertMsgConfig
  ): Promise<void>;
  sendQuantAlert(
    accessToken: string,
    channelName: string,
    messageProps: QuantAlertMsgConfig
  ): Promise<void>;
  getConversations(accessToken: string): Promise<SlackConversationInfo[]>;
  joinConversation(accessToken: string, channelId: string): Promise<void>;
  leaveConversation(accessToken: string, channelId: string): Promise<void>;
}
