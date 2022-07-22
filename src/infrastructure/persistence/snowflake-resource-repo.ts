import sanitize from 'mongo-sanitize';

import { Connection, Statement } from 'snowflake-sdk';
import { DbOptions } from '../../domain/services/i-db';
import { connect, handleStreamError } from './db/snowflake';
import { SnowflakeResource } from '../../domain/value-types/snowflake-resource';
import { ISnowflakeResourceRepo } from '../../domain/snowflake-resource/i-snowflake-resource-repo';
import { appConfig } from '../../config';

export default class SnowflakeResourceRepo implements ISnowflakeResourceRepo {
  runQuery = async (
    query: string,
    options: DbOptions
  ): Promise<SnowflakeResource[]> =>
    new Promise((resolve, reject) => {
      const results: SnowflakeResource[] = [];

      const connection = connect({
        ...options,
        application: appConfig.snowflake.applicationName,
      });

      connection.connect((err, conn) => {
        if (err) {
          if (typeof err === 'string') reject(err);
          if (err instanceof Error) reject(err.message);
          reject(new Error('Unknown error occured'));
        }

        console.log('connected');
        // Optional: store the connection ID.
        const connectionId = conn.getId();
        console.log(connectionId);

        const complete = (error: any, stmt: Statement): void => {
          if (error)
            throw new Error(
              `Failed to execute statement ${stmt.getStatementId()} due to the following error: ${
                error.message
              }`
            );
        };
        // todo - include select statements once dwh-to-dashboard is going to be implemented
        const statement = connection.execute({
          sqlText: sanitize(query),
          complete,
        });

        const stream = statement.streamRows();

        stream.on('data', (row: any) => results.push(row));
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
      });
    });
}
