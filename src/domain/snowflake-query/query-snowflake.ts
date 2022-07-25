import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { SnowflakeQuery } from '../value-types/snowflake-query';
import { ISnowflakeQueryRepo } from './i-snowflake-query-repo';
import { ReadSnowflakeProfile } from '../snowflake-profile/read-snowflake-profile';

export interface CrudSnowflakeQueryRequestDto {
  query: string;
}

export interface CrudSnowflakeQueryAuthDto {
  organizationId: string;
}

export type CrudSnowflakeQueryResponseDto = Result<SnowflakeQuery>;

export class CrudSnowflakeQuery
  implements
    IUseCase<
      CrudSnowflakeQueryRequestDto,
      CrudSnowflakeQueryResponseDto,
      CrudSnowflakeQueryAuthDto,
      DbConnection,
      DbEncryption
    >
{
  readonly #snowflakeQueryRepo: ISnowflakeQueryRepo;

  readonly #readSnowflakeProfile: ReadSnowflakeProfile;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(
    snowflakeQueryRepo: ISnowflakeQueryRepo,
    readSnowflakeProfile: ReadSnowflakeProfile
  ) {
    this.#snowflakeQueryRepo = snowflakeQueryRepo;
    this.#readSnowflakeProfile = readSnowflakeProfile;
  }

  async execute(
    request: CrudSnowflakeQueryRequestDto,
    auth: CrudSnowflakeQueryAuthDto,
    dbConnection: DbConnection
  ): Promise<CrudSnowflakeQueryResponseDto> {
    try {
      // todo -replace
      console.log(auth);

      this.#dbConnection = dbConnection;

      const readSnowflakeProfileResult =
        await this.#readSnowflakeProfile.execute(
          {
            organizationId: auth.organizationId,
          },
          { organizationId: auth.organizationId },
          this.#dbConnection,
          this.#dbEncryption
        );

      if (!readSnowflakeProfileResult.success)
        throw new Error(readSnowflakeProfileResult.error);
      if (!readSnowflakeProfileResult.value)
        throw new Error('SnowflakeProfile does not exist');

      const snowflakeProfile = readSnowflakeProfileResult.value;

      const snowflakeQuery = await this.#snowflakeQueryRepo.runQuery(
        request.query,
        {account: snowflakeProfile.accountId, username: snowflakeProfile.username, password: snowflakeProfile.password}
      );

      // if (snowflakeQuery.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(snowflakeQuery);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
