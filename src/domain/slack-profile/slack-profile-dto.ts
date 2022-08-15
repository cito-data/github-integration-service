import { SlackProfile } from '../entities/slack-profile';

export interface SlackProfileDto {
  id: string;
  organizationId: string;
  channelId: string;
  channelName: string;
  accessToken: string;
}

export const buildSlackProfileDto = (
  slackProfile: SlackProfile
): SlackProfileDto => ({
  id: slackProfile.id,
  organizationId: slackProfile.organizationId,
  channelId: slackProfile.channelId,
  channelName: slackProfile.channelName,
  accessToken: slackProfile.accessToken,
});
