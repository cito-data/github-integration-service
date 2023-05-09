import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import {
  getCreateDbSchemaQuery,
  CitoSchemaName,
} from '../services/snowflake-materialization-creation-model';
import Dbo from '../../infrastructure/persistence/db/mongo-db';
import CreateCitoSnowflakeEnvRepo from '../../infrastructure/persistence/create-cito-sf-env-repo';

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

  readonly repo: CreateCitoSnowflakeEnvRepo;

  #dbConnection?: DbConnection;

  constructor(
    querySnowflake: QuerySnowflake, 
    createCitoSnowflakeEnvRepo: CreateCitoSnowflakeEnvRepo
  ) {
    this.#querySnowflake = querySnowflake;
    this.repo = createCitoSnowflakeEnvRepo;
  }

  #createSchema = async (
    schemaName: CitoSchemaName,
    auth: { callerOrgId: string; isSystemInternal: boolean }
  ): Promise<void> => {
    if (!this.#dbConnection)
      throw new Error('Missing db connection');
    const createObservabilitySchemaResult =
      await this.#querySnowflake.execute(
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

      await this.repo.createCollections(dbo, auth.callerOrgId);

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
