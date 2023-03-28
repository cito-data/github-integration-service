import { DbOptions } from '../services/i-db';

export interface SnowflakeEntity {
  [fieldName: string]: string | number | boolean | null;
}

export interface Bind {
  type: 'fixed' | 'text';
  value: string;
}

export type Binds = Bind[] | Bind[][];

export interface ISnowflakeApiRepo {
  runQuery(
    queryText: string,
    binds: Binds,
    dbOptions: DbOptions
  ): Promise<SnowflakeEntity[]>;
}
