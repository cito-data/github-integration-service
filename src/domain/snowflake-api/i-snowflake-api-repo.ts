import { DbOptions } from '../services/i-db';
import { SnowflakeQuery } from '../value-types/snowflake-query';
import Result from '../value-types/transient-types/result';

export interface ISnowflakeApiRepo {
  runQuery(query: string, options: DbOptions): Promise<Result<SnowflakeQuery[]>>;
}
