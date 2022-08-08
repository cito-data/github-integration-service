import { SlackProfile } from '../entities/slack-profile';

export interface SlackProfileDto {
  id: string;
  organizationId: string;
  channelId: string;
  accessToken: string;
  workspaceId: string;
}

export const buildSlackProfileDto = (
  slackProfile: SlackProfile
): SlackProfileDto => ({
  id: slackProfile.id,
  organizationId: slackProfile.organizationId,
  workspaceId: slackProfile.workspaceId,
  channelId: slackProfile.channelId,
  accessToken: slackProfile.accessToken,
});
