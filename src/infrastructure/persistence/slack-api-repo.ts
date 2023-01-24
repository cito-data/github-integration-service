import { Block, KnownBlock, WebClient } from '@slack/web-api';
import { appConfig } from '../../config';
import {
  ISlackApiRepo,
  QualAlertMsgConfig,
  QuantAlertMsgConfig,
} from '../../domain/slack-api/i-slack-api-repo';
import { SlackConversationInfo } from '../../domain/value-types/slack-conversation-info';

export default class SlackApiRepo implements ISlackApiRepo {
  #buildQualMsgBlock = (
    msgConfig: QualAlertMsgConfig
  ): (Block | KnownBlock)[] => {
    const blocks = [];

    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${msgConfig.anomalyMessagePart}`,
      },
    });

    blocks.push({
      type: 'section',
      text: {
        text: msgConfig.summaryPart,
        type: 'mrkdwn',
      },
      fields: [
        {
          type: 'mrkdwn',
          text: msgConfig.detectedValuePart,
        },
      ],
    });
    blocks.push({
      type: 'divider',
    });
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: `occurred on: ${msgConfig.occurredOn}`,
        },
        {
          type: 'plain_text',
          text: `alert id: ${msgConfig.alertId}`,
        },
      ],
    });

    return blocks;
  };

  #buildQuantMsgBlock = (
    msgConfig: QuantAlertMsgConfig
  ): (Block | KnownBlock)[] => {
    const blocks = [];

    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${msgConfig.anomalyMessagePart}`,
      },
    });

    blocks.push({
      type: 'section',
      text: {
        text: msgConfig.summaryPart,
        type: 'mrkdwn',
      },
      fields: [
        {
          type: 'mrkdwn',
          text: msgConfig.detectedValuePart,
        },
        {
          type: 'mrkdwn',
          text: msgConfig.expectedRangePart,
        },
      ],
    });
    blocks.push({
      type: 'image',
      title: {
        type: 'plain_text',
        text: 'Test History Chart',
        emoji: true,
      },
      image_url: msgConfig.imageUrl,
      alt_text: 'chart',
    });
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          style: 'danger',
          url: `${appConfig.slack.buttonBaseUrl}?alertId=${msgConfig.alertId}&testType=${msgConfig.testType}&userFeedbackIsAnomaly=1`,
          text: {
            type: 'plain_text',
            text: 'Mark as Anomaly',
          },
          value: 'click_me_123',
          action_id: 'mark-anomaly-button',
        },
        {
          type: 'button',
          style: 'primary',
          url: `${appConfig.slack.buttonBaseUrl}?alertId=${msgConfig.alertId}&testType=${msgConfig.testType}&testSuiteId=${msgConfig.testSuiteId}&importance=${msgConfig.importance}&userFeedbackIsAnomaly=0`,
          text: {
            type: 'plain_text',
            text: 'Mark as Normal',
          },
          value: 'click_me_123',
          action_id: 'mark-normal-button',
        },
      ],
    });
    blocks.push({
      type: 'divider',
    });
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: `occurred on: ${msgConfig.occurredOn}`,
        },
        {
          type: 'plain_text',
          text: `alert id: ${msgConfig.alertId}`,
        },
      ],
    });

    return blocks;
  };

  sendQualAlert = async (
    accessToken: string,
    channelName: string,
    messageConfig: QualAlertMsgConfig
  ): Promise<void> => {
    try {
      const client = new WebClient(accessToken);

      const blocks = this.#buildQualMsgBlock(messageConfig);

      await client.chat.postMessage({
        channel: `#${channelName}`,
        text: 'Something went wrong',
        blocks,
      });

      return await Promise.resolve();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  sendQuantAlert = async (
    accessToken: string,
    channelName: string,
    messageConfig: QuantAlertMsgConfig
  ): Promise<void> => {
    try {
      const client = new WebClient(accessToken);

      const blocks = this.#buildQuantMsgBlock(messageConfig);

      await client.chat.postMessage({
        channel: `#${channelName}`,
        text: 'Something went wrong',
        blocks,
      });

      return await Promise.resolve();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  getConversations = async (
    accessToken: string
  ): Promise<SlackConversationInfo[]> => {
    try {
      const client = new WebClient(accessToken);

      const result = await client.conversations.list({
        exclude_archived: true,
      });

      const { channels } = result;

      if (!channels) throw new Error('No channels found');

      const channelInfo: SlackConversationInfo[] = channels
        .map((channel) =>
          channel
            ? {
                id: channel.id,
                name: channel.name,
                isChannel: channel.is_channel,
                isPrivate: channel.is_private,
              }
            : undefined
        )
        .filter((element): element is SlackConversationInfo => !!element);

      return channelInfo;
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  joinConversation = async (
    accessToken: string,
    channelId: string
  ): Promise<void> => {
    try {
      const client = new WebClient(accessToken);

      const result = await client.conversations.join({
        channel: channelId,
        token: accessToken,
      });

      if (!result.ok) throw new Error('Joining channel failed');

      return await Promise.resolve();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  leaveConversation = async (
    accessToken: string,
    channelId: string
  ): Promise<void> => {
    try {
      const client = new WebClient(accessToken);

      const result = await client.conversations.leave({
        channel: channelId,
        token: accessToken,
      });

      if (!result.ok) throw new Error('Leaving channel failed');

      return await Promise.resolve();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };
}
