import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import {
  citoMaterializationNames,
  getCreateTableQuery,
  getCreateDbSchemaQuery,
  CitoSchemaName,
} from '../services/snowflake-materialization-creation-model';

export type CreateCitoSnowflakeEnvRequestDto = null;

export interface CreateCitoSnowflakeEnvAuthDto {
  callerOrganizationId: string;
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
      DbConnection
    >
{
  readonly #querySnowflake: QuerySnowflake;

  #dbConnection: DbConnection;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  #createSchema = async (
    schemaName: CitoSchemaName,
    auth: { callerOrganizationId: string; isSystemInternal: boolean }
  ): Promise<void> => {
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
    dbConnection: DbConnection
  ): Promise<CreateCitoSnowflakeEnvResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      await this.#createSchema('observability', auth);
      await this.#createSchema('lineage', auth);

      const createTableResults = await Promise.all(
        citoMaterializationNames.map(async (type) => {
          const query = getCreateTableQuery(type);
          const createTableResult = await this.#querySnowflake.execute(
            {
              query,
            },
            {
              callerOrganizationId: auth.callerOrganizationId,
              isSystemInternal: auth.isSystemInternal,
            },
            this.#dbConnection
          );

          return createTableResult;
        })
      );

      if (createTableResults.some((el: any) => !el.success))
        throw new Error(createTableResults[0].error);

      // if (snowflakeCreate.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok({
        organizationId: auth.callerOrganizationId,
        success: true,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
