import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import {
  citoMaterializationNames,
  getCreateDbSchemaQuery,
  CitoSchemaName,
} from '../services/snowflake-materialization-creation-model';
import { appConfig } from '../../config';
import Dbo from '../../infrastructure/persistence/db/mongo-db';

export type CreateCitoSnowflakeEnvRequestDto = null;

export interface CreateCitoSnowflakeEnvAuthDto {
  callerOrgId: string;
  isSystemInternal: boolean;
}

export type CreateCitoSnowflakeEnvResponseDto = Result<{
  organizationId: string;
  success: boolean;
}>;

export class CreateCitoSnowflakeEnv
  implements
    IUseCase<
      CreateCitoSnowflakeEnvRequestDto,
      CreateCitoSnowflakeEnvResponseDto,
      CreateCitoSnowflakeEnvAuthDto,
      Dbo
    >
{
  readonly #querySnowflake: QuerySnowflake;

  #dbConnection?: DbConnection;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  #createSchema = async (
    schemaName: CitoSchemaName,
    auth: { callerOrgId: string; isSystemInternal: boolean }
  ): Promise<void> => {
    if (!this.#dbConnection)
      throw new Error('Missing db connection');
    const createObservabilitySchemaResult =
      await await this.#querySnowflake.execute(
        {
          query: getCreateDbSchemaQuery(schemaName),
        },
        auth,
        this.#dbConnection
      );

    if (!createObservabilitySchemaResult.success)
      throw new Error(createObservabilitySchemaResult.error);
  };

  async execute(
    request: CreateCitoSnowflakeEnvRequestDto,
    auth: CreateCitoSnowflakeEnvAuthDto,
    dbo: Dbo
  ): Promise<CreateCitoSnowflakeEnvResponseDto> {
    try {
      this.#dbConnection = dbo.dbConnection;

      const clientConnection = await dbo.client.connect();
      const userEnvConnection = clientConnection.db(appConfig.mongodb.userEnvDbName);

      citoMaterializationNames.map(async (type) => {
          await userEnvConnection.createCollection(`${type}_${auth.callerOrgId}`)
            .then()
            .catch((error) => {
              console.log(`Could not create collection ${type}: ${error}`);
            });
      });

      await clientConnection.close();
      
      return Result.ok({
        organizationId: auth.callerOrgId,
        success: true,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
