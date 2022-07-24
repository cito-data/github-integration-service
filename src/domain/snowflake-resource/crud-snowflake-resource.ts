import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { SnowflakeResource } from '../value-types/snowflake-resource';
import { ISnowflakeResourceRepo } from './i-snowflake-resource-repo';
import { ReadSnowflakeProfile } from '../snowflake-profile/read-snowflake-profile';

export interface CrudSnowflakeResourceRequestDto {
  query: string;
}

export interface CrudSnowflakeResourceAuthDto {
  organizationId: string;
}

export type CrudSnowflakeResourceResponseDto = Result<SnowflakeResource>;

export class CrudSnowflakeResource
  implements
    IUseCase<
      CrudSnowflakeResourceRequestDto,
      CrudSnowflakeResourceResponseDto,
      CrudSnowflakeResourceAuthDto,
      DbConnection,
      DbEncryption
    >
{
  readonly #snowflakeResourceRepo: ISnowflakeResourceRepo;

  readonly #readSnowflakeProfile: ReadSnowflakeProfile;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(
    snowflakeResourceRepo: ISnowflakeResourceRepo,
    readSnowflakeProfile: ReadSnowflakeProfile
  ) {
    this.#snowflakeResourceRepo = snowflakeResourceRepo;
    this.#readSnowflakeProfile = readSnowflakeProfile;
  }

  async execute(
    request: CrudSnowflakeResourceRequestDto,
    auth: CrudSnowflakeResourceAuthDto,
    dbConnection: DbConnection
  ): Promise<CrudSnowflakeResourceResponseDto> {
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

      const snowflakeResource = await this.#snowflakeResourceRepo.runQuery(
        request.query,
        {account: snowflakeProfile.accountId, username: snowflakeProfile.username, password: snowflakeProfile.password}
      );

      // if (snowflakeResource.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(snowflakeResource);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
