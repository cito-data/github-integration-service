import { DbOptions } from '../services/i-db';
import { SnowflakeQuery } from '../value-types/snowflake-query';

export interface ISnowflakeQueryRepo {
  runQuery(query: string, options: DbOptions): Promise<SnowflakeQuery[]>;
}
