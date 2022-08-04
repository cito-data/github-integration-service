import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { SnowflakeQuery } from '../value-types/snowflake-query';
import { ISnowflakeQueryRepo } from './i-snowflake-query-repo';
import { ReadSnowflakeProfile } from '../snowflake-profile/read-snowflake-profile';
import { ReadSnowflakeProfiles } from '../snowflake-profile/read-snowflake-profiles';
import { SnowflakeProfile } from '../entities/snowflake-profile';

export interface QuerySnowflakeRequestDto {
  query: string;
}

export interface QuerySnowflakeAuthDto {
  organizationId: string;
  isSystemInternal: boolean;
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

  readonly #readSnowflakeProfiles: ReadSnowflakeProfiles;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(
    snowflakeQueryRepo: ISnowflakeQueryRepo,
    readSnowflakeProfile: ReadSnowflakeProfile,
    readSnowflakeProfiles: ReadSnowflakeProfiles
  ) {
    this.#snowflakeQueryRepo = snowflakeQueryRepo;
    this.#readSnowflakeProfile = readSnowflakeProfile;
    this.#readSnowflakeProfiles = readSnowflakeProfiles;
  }

  #getSnowflakeProfile = async (
    organizationId: string
  ): Promise<SnowflakeProfile> => {
    const readSnowflakeProfileResult = await this.#readSnowflakeProfile.execute(
      null,
      {
        organizationId,
      },
      this.#dbConnection,
      this.#dbEncryption
    );

    if (!readSnowflakeProfileResult.success)
      throw new Error(readSnowflakeProfileResult.error);
    if (!readSnowflakeProfileResult.value)
      throw new Error('SnowflakeProfile does not exist');

    return readSnowflakeProfileResult.value;
  };

  #getSnowflakeProfiles = async (
    isSystemInternal: boolean
  ): Promise<SnowflakeProfile[]> => {
    const readSnowflakeProfilesResult =
      await this.#readSnowflakeProfiles.execute(
        null,
        {
          isSystemInternal,
        },
        this.#dbConnection,
        this.#dbEncryption
      );

    if (!readSnowflakeProfilesResult.success)
      throw new Error(readSnowflakeProfilesResult.error);
    if (!readSnowflakeProfilesResult.value)
      throw new Error('SnowflakeProfiles do not exist');

    return readSnowflakeProfilesResult.value;
  };

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

      const snowflakeProfiles = auth.isSystemInternal
        ? await this.#getSnowflakeProfiles(auth.isSystemInternal)
        : [await this.#getSnowflakeProfile(auth.organizationId)];

      const snowflakeQuery: {[key: string]: any[]} = {};
      
      await Promise.all(
        snowflakeProfiles.map(async (profile) => {
          const queryResult = await this.#snowflakeQueryRepo.runQuery(
            request.query,
            {
              account: profile.accountId,
              username: profile.username,
              password: profile.password,
            }
          );
          snowflakeQuery[profile.organizationId] = queryResult;
        })
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

// const groupBy = <TItem>(
//   data: TItem[],
//   key: string
// ): { [key: string]: TItem[] } =>
//   data.reduce((storage: any, item: any) => {
//     (storage[item[key]] = storage[item[key]] || []).push(item);
//     return storage;
//   }, {});
