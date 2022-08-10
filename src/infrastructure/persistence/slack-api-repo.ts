import { WebClient } from '@slack/web-api';
import { ISlackApiRepo } from '../../domain/slack-api/i-slack-api-repo';
import { SlackConversationInfo } from '../../domain/value-types/slack-conversation-info';

export default class SlackApiRepo implements ISlackApiRepo {
  sendAlert = async (
    accessToken: string,
    channelName: string,
    message: string
  ): Promise<void> => {
    try {
      const client = new WebClient(accessToken);

      await client.chat.postMessage({
        // channel: '#general',
        channel: channelName,
        text: message,
      });

      return await Promise.resolve();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  getConversations = async (accessToken: string): Promise<SlackConversationInfo[]> => {
    try {
      const client = new WebClient(accessToken);

      const result = await client.conversations.list({
        exclude_archived: true,
      });

      const { channels } = result;

      if (!channels) throw new Error('No channels found');

      const channelInfo: SlackConversationInfo[] = channels
        .map((channel) =>
          channel ? { id: channel.id, name: channel.name, isChannel: channel.is_channel, isPrivate: channel.is_private } : undefined
        )
        .filter((element): element is SlackConversationInfo => !!element);

      return channelInfo;
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };
}
