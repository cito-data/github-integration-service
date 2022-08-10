import { SlackConversationInfo } from '../value-types/slack-conversation-info';

export type ConversationInfoDto = SlackConversationInfo

export const buildConversationInfoDto = (
  channelInfo: SlackConversationInfo
): ConversationInfoDto => ({ ...channelInfo });
