import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { SnowflakeQuery } from '../value-types/snowflake-query';
import { ISnowflakeQueryRepo } from './i-snowflake-query-repo';
import { ReadSnowflakeProfile } from '../snowflake-profile/read-snowflake-profile';

export interface QuerySnowflakeRequestDto {
  query: string;
}

export interface QuerySnowflakeAuthDto {
  organizationId: string;
}

export type QuerySnowflakeResponseDto = Result<SnowflakeQuery>;

export class QuerySnowflake
  implements
    IUseCase<
      QuerySnowflakeRequestDto,
      QuerySnowflakeResponseDto,
      QuerySnowflakeAuthDto,
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
    request: QuerySnowflakeRequestDto,
    auth: QuerySnowflakeAuthDto,
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<QuerySnowflakeResponseDto> {
    try {
      // todo -replace
      console.log(auth);

      this.#dbConnection = dbConnection;

      this.#dbEncryption = dbEncryption;

      const readSnowflakeProfileResult =
        await this.#readSnowflakeProfile.execute(
          null,
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
        {
          account: snowflakeProfile.accountId,
          username: snowflakeProfile.username,
          password: snowflakeProfile.password,
        }
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
