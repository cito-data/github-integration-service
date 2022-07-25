import { SnowflakeQuery } from "../value-types/snowflake-query";

export type SnowflakeQueryDto = any;

export const buildSnowflakeQueryDto = (snowflakeQuery: SnowflakeQuery): SnowflakeQueryDto => snowflakeQuery;