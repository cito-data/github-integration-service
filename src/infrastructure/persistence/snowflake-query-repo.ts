import { Connection, Statement } from 'snowflake-sdk';
import { DbOptions } from '../../domain/services/i-db';
import { connect, handleStreamError } from './db/snowflake';
import { SnowflakeQuery } from '../../domain/value-types/snowflake-query';
import { ISnowflakeQueryRepo } from '../../domain/snowflake-query/i-snowflake-query-repo';
import { appConfig } from '../../config';

export default class SnowflakeQueryRepo implements ISnowflakeQueryRepo {
  runQuery = async (
    query: string,
    options: DbOptions
  ): Promise<SnowflakeQuery[]> =>
    new Promise((resolve, reject) => {
      const results: SnowflakeQuery[] = [];

      const connection = connect({
        ...options,
        application: appConfig.snowflake.applicationName,
      });

      connection.connect((err, conn) => {
        try {
          if (err) {
            if (typeof err === 'string') reject(err);
            if (err instanceof Error) reject(err.message);
            reject(new Error('Unknown error occured'));
          }

          // Optional: store the connection ID.
          const connectionId = conn.getId();
          console.log(`sf connection: ${connectionId}`);

          const complete = (error: any, stmt: Statement): void => {
            if (error)
              console.error(
                `Failed to execute statement ${stmt.getStatementId()} due to the following error: ${
                  error.message
                }`
              );
          };
         
          
          // todo - include select statements once dwh-to-dashboard is going to be implemented
          const statement = connection.execute({
            sqlText: query,
            complete,
          });

          const stream = statement.streamRows();

          stream.on('data', (row: any) => {
            if(row) results.push(row);
          });
          stream.on('error', handleStreamError);
          stream.on('end', () =>
            connection.destroy(
              (destroyError: any, connectionToDestroy: Connection) => {
                if (destroyError)
                  throw new Error(
                    `Unable to disconnect: ${destroyError.message}`
                  );
                else {
                  console.log(
                    `Disconnected connection with id: ${connectionToDestroy.getId()}`
                  );
                  resolve(results);
                }
              }
            )
          );
        } catch (error: unknown) {
          if (typeof error === 'string') reject(error);
          if (error instanceof Error) reject(error.message);
          reject(new Error('Unknown error occured'));
        }
      });
    });
}
