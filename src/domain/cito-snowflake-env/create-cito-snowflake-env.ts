import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import {
  citoMaterializationTypes,
  getCreateTableQuery,
} from '../services/snowflake-materialization-creation-model';

export type CreateCitoSnowflakeEnvRequestDto = null;

export interface CreateCitoSnowflakeEnvAuthDto {
  callerOrganizationId: string;
  isSystemInternal: boolean
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
      DbConnection,
      DbEncryption
    >
{
  readonly #querySnowflake: QuerySnowflake;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: CreateCitoSnowflakeEnvRequestDto,
    auth: CreateCitoSnowflakeEnvAuthDto,
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<CreateCitoSnowflakeEnvResponseDto> {
    try {

      this.#dbConnection = dbConnection;

      this.#dbEncryption = dbEncryption;

      const createTableResults = await Promise.all(
        citoMaterializationTypes.map(async (type) => {
          const query = getCreateTableQuery(type);

          const createTableResult = await this.#querySnowflake.execute(
            {
              query,
            },
            { callerOrganizationId: auth.callerOrganizationId, isSystemInternal: auth.isSystemInternal },
            this.#dbConnection,
            this.#dbEncryption
          );

          return createTableResult;
        })
      );

      if (createTableResults.some((el: any) => !el.success))
        throw new Error(createTableResults[0].error);

      // if (snowflakeCreate.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok({ organizationId: auth.callerOrganizationId, success: true });
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
