import { Connection, Statement } from 'snowflake-sdk';
import { DbOptions } from '../../domain/services/i-db';
import { connect, handleStreamError } from './db/snowflake';
import { SnowflakeQuery } from '../../domain/value-types/snowflake-query';
import { ISnowflakeApiRepo } from '../../domain/snowflake-api/i-snowflake-api-repo';
import { appConfig } from '../../config';

export default class SnowflakeApiRepo implements ISnowflakeApiRepo {
  runQuery = async (
    query: string,
    options: DbOptions
  ): Promise<SnowflakeQuery[]> =>
    new Promise((resolve, reject) => {
      const results: SnowflakeQuery[] = [];

      const destroy = (conn: Connection, error?: Error): void => {
        if (!conn.isUp()) return;

        conn.destroy((destroyError: any, connectionToDestroy: Connection) => {
          if (destroyError)
            throw new Error(`Unable to disconnect: ${destroyError.message}`);
          else {
            console.log(
              `Disconnected connection with id: ${connectionToDestroy.getId()}`
            );
            if (error) reject(error);
            resolve(results);
          }
        });
      };

      const connection = connect({
        ...options,
        application: appConfig.snowflake.applicationName,
      });

      connection.connect((err, conn) => {
        try {
          if (err) {
            if (typeof err === 'string') reject(err);
            if (err instanceof Error) reject(err.message);
            reject(new Error('Unknown Snowflake connection error occured'));
          }

          // Optional: store the connection ID.
          const connectionId = conn.getId();
          console.log(`SF connection: ${connectionId} executing ${query.substring(0, 50)}...`);

          const complete = (error: any, stmt: Statement): void => {
            if (error) {
              console.error(
                `Failed to execute statement ${stmt.getStatementId()} due to the following error: ${
                  error.message
                }`
              );
              destroy(conn, new Error(`Snowflake query ${error.message}`));
            }
          };

          // todo - include select statements once dwh-to-dashboard is going to be implemented
          const statement = conn.execute({
            sqlText: query,
            complete,
          });

          const stream = statement.streamRows();

          stream.on('data', (row: any) => {
            if (row) results.push(row);
          });
          stream.on('error', handleStreamError);
          stream.on('end', () => destroy(conn));
        } catch (error: unknown) {
          if (typeof error === 'string') reject(error);
          if (error instanceof Error) reject(error.message);
          reject(new Error('Unknown error occured'));
        }
      });
    });
}
