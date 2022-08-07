import { SlackProfile } from '../entities/slack-profile';

export interface SlackProfileDto {
  id: string;
  organizationId: string;
  channelId: string;
  token: string;
  workspaceId: string;
}

export const buildSlackProfileDto = (
  slackProfile: SlackProfile
): SlackProfileDto => ({
  id: slackProfile.id,
  organizationId: slackProfile.organizationId,
  workspaceId: slackProfile.workspaceId,
  channelId: slackProfile.channelId,
  token: slackProfile.token,
});
