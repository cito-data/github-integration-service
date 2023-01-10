import { SlackProfile } from '../entities/slack-profile';
import { DbConnection } from '../services/i-db';

export interface SlackProfileUpdateDto {
  channelId?: string;
  channelName?: string;
  accessToken?: string;
}

export interface ISlackProfileRepo {
  findOne(
    organizationId: string,
    dbConnection: DbConnection
  ): Promise<SlackProfile | null>;
  insertOne(
    slackProfile: SlackProfile,
    dbConnection: DbConnection
  ): Promise<string>;
  updateOne(
    id: string,
    updateDto: SlackProfileUpdateDto,
    dbConnection: DbConnection
  ): Promise<string>;
  deleteOne(id: string, dbConnection: DbConnection): Promise<string>;
}
