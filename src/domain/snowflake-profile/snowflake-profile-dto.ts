import { SnowflakeProfile } from '../entities/snowflake-profile';

export interface SnowflakeProfileDto {
  id: string;
  organizationId: string;
  accountId: string;
  username: string;
  password: string;
  warehouseName: string;
}

export const buildSnowflakeProfileDto = (
  snowflakeProfile: SnowflakeProfile
): SnowflakeProfileDto => ({
  id: snowflakeProfile.id,
  organizationId: snowflakeProfile.organizationId,
  accountId: snowflakeProfile.accountId,
  username: snowflakeProfile.username,
  password: snowflakeProfile.password,
  warehouseName: snowflakeProfile.warehouseName
});
