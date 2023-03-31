import { appConfig } from '../../config';
import {
  Binds,
  ISnowflakeApiRepo,
  SnowflakeEntity,
} from '../../domain/snowflake-api/i-snowflake-api-repo';
import getApiClient from './api/api-client';

type SfQueryRawRow = (string | null)[];

interface SfQueryResultPartition {
  data: SfQueryRawRow[];
}

const isSfQueryResultPartition = (obj: unknown): obj is SfQueryResult =>
  typeof obj === 'object' &&
  !!obj &&
  'data' in obj &&
  Array.isArray(obj) &&
  'resultSetMetaData' in obj &&
  'partitionInfo' in obj &&
  'statementHandle' in obj;

interface SfQueryResult {
  data: SfQueryRawRow[];
  resultSetMetaData: {
    rowType: {
      name: string;
      type: string;
    }[];
    partitionInfo: { [key: string]: unknown }[];
    statementHandle: string;
  };
}

const isSfQueryResult = (obj: unknown): obj is SfQueryResult =>
  typeof obj === 'object' &&
  !!obj &&
  'data' in obj &&
  Array.isArray(obj) &&
  'resultSetMetaData' in obj &&
  'partitionInfo' in obj &&
  'statementHandle' in obj;

export default class SnowflakeApiRepo implements ISnowflakeApiRepo {
  #getResultBaseMsg = (
    stringifiedBinds: string,
    queryText: string
  ): string => `Binds: ${stringifiedBinds.substring(0, 1000)}${
    stringifiedBinds.length > 1000 ? '...' : ''
  }
    \n${queryText.substring(0, 1000)}${queryText.length > 1000 ? '...' : ''}`;

  #generateResult = (
    baseResult: SfQueryResult,
    partitionData: SfQueryResultPartition[]
  ): SnowflakeEntity[] => {
    const allData: SfQueryRawRow[] = [
      baseResult.data,
      ...partitionData.map((p) => p.data),
    ].flat();

    const { rowType } = baseResult.resultSetMetaData;

    const rows = allData.map((row): SnowflakeEntity => {
      const obj: { [key: string]: string | number | boolean | null } = {};
      for (let i = 0; i < rowType.length; i += 1) {
        const { name, type } = rowType[i];

        let val: string | number | boolean | null = row[i];
        switch (type.toLowerCase()) {
          case 'fixed': {
            val = Number(row[i]);
            if (Number.isNaN(val))
              throw new Error("Invalid value for 'fixed' type");

            break;
          }
          case 'boolean': {
            val = Boolean(row[i]);

            break;
          }
          default:
            break;
        }

        obj[name] = val;
      }

      return obj;
    });

    return rows;
  };

  #formatBinds = (binds: Binds): { [key: string]: Bind } => {
    const formattedBinds: { [key: string]: Bind } = {};

    for (let i = 0; i < binds.length; i += 1) {
      const el = binds[i];
      formattedBinds[`${i + 1}`] = el;
    }

    return formattedBinds;
  };

  runQuery = async (
    accountId: string,
    authConfig: {
      username: string;
      targetOrgId: string;
    },
    query: {
      text: string;
      bindings: Binds;
      warehouseName: string;
    }
  ): Promise<SnowflakeEntity[]> => {
    try {
      const client = getApiClient(
        `https://${accountId}.snowflakecomputing.com`,
        {
          ...authConfig,
          accountId,
          type: 'snowflake',
        }
      );

      const data = {
        statement: query.text,
        bindings: this.#formatBinds(query.bindings),
        warehouse: query.warehouseName,
        timeout: 10,
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT',
          'User-Agent': `${appConfig.snowflake.userAgent}`,
        },
      };

      const postStatementResult = await client.post(
        `/api/v2/statements`,
        data,
        config
      );

      const queryData = {
        statement: queryText,
        binds,
        warehouse: options.warehouseName,
        timeout: 10,
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Snowflake-Account': options.accountId,
        },
      };

      const postStatementResult = await client.post(
        `/api/v2/statements`,
        queryData,
        config
      );

      const rawData = postStatementResult.data;

      if (postStatementResult.status !== 200) {
        console.error(
          `Error (http status code: ${
            postStatementResult.status
          }) running query: ${this.#getResultBaseMsg(
            JSON.stringify(binds),
            queryText
          )}`
        );

        const cancelStatementResult = await client.post(
          `/api/v2/statements/${rawData.resultSetMetaData.statementHandle}/cancel`,
          queryData,
          config
        );
        throw new Error(cancelStatementResult.data.message);
      }

      if (!isSfQueryResult(rawData)) throw new Error('Invalid response data');

      let partitionResponses: SfQueryResultPartition[] = [];
      if (rawData.resultSetMetaData.partitionInfo.length > 1) {
        partitionResponses = (
          await Promise.all(
            rawData.resultSetMetaData.partitionInfo.map(
              async (
                partition,
                i
              ): Promise<SfQueryResultPartition | undefined> => {
                if (i === 0) return undefined;

                const getPartitionResult = await client.get(
                  `/api/v2/statements/${rawData.resultSetMetaData.statementHandle}?partition=${i}`,
                  config
                );
                const partitionData = getPartitionResult.data;

                if (!isSfQueryResultPartition(partitionData))
                  throw new Error('Invalid partition data');

                return partitionData;
              }
            )
          )
        ).filter(isSfQueryResultPartition);
      }
      return this.#generateResult(rawData, partitionResponses);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };
}
