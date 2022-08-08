import { SlackProfile } from '../entities/slack-profile';
import { DbConnection, DbEncryption } from '../services/i-db';

export interface SlackProfileUpdateDto {
  channelId?: string;
  accessToken?: string;
  workspaceId?: string;
}

export interface ISlackProfileRepo {
  findOne(
    organizationId: string,
    dbConnection: DbConnection,
    encryption: DbEncryption
  ): Promise<SlackProfile | null>;
  insertOne(
    slackProfile: SlackProfile,
    dbConnection: DbConnection,
    encryption: DbEncryption
  ): Promise<string>;
  updateOne(
    id: string,
    updateDto: SlackProfileUpdateDto,
    dbConnection: DbConnection,
    encryption?: DbEncryption
  ): Promise<string>;
  deleteOne(id: string, dbConnection: DbConnection): Promise<string>;
}
