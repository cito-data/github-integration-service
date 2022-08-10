import { DbOptions } from '../services/i-db';
import { SnowflakeQuery } from '../value-types/snowflake-query';

export interface ISnowflakeApiRepo {
  runQuery(query: string, options: DbOptions): Promise<SnowflakeQuery[]>;
}
