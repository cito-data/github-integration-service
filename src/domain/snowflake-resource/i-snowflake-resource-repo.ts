import { DbOptions } from '../services/i-db';
import { SnowflakeResource } from '../value-types/snowflake-resource';

export interface ISnowflakeResourceRepo {
  runQuery(query: string, options: DbOptions): Promise<SnowflakeResource[]>;
}
