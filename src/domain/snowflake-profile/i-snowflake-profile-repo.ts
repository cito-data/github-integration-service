import { SnowflakeProfile } from '../entities/snowflake-profile';
import { DbConnection, DbEncryption } from '../services/i-db';

export interface SnowflakeProfileUpdateDto {
  accountId?: string;
  username?: string;
  password?: string;
}

export interface ISnowflakeProfileRepo {
  findOne(
    organizationId: string,
    dbConnection: DbConnection,
    encryption: DbEncryption
  ): Promise<SnowflakeProfile | null>;
  all(
    dbConnection: DbConnection,
    encryption: DbEncryption
  ): Promise<SnowflakeProfile[]>;
  insertOne(
    snowflakeProfile: SnowflakeProfile,
    dbConnection: DbConnection,
    encryption: DbEncryption
  ): Promise<string>;
  updateOne(
    id: string,
    updateDto: SnowflakeProfileUpdateDto,
    dbConnection: DbConnection,
    encryption?: DbEncryption
  ): Promise<string>;
  deleteOne(id: string, dbConnection: DbConnection): Promise<string>;
}
