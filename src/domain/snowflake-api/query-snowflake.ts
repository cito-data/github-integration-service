import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { SnowflakeQuery } from '../value-types/snowflake-query';
import { ISnowflakeApiRepo } from './i-snowflake-api-repo';
import { ReadSnowflakeProfile } from '../snowflake-profile/read-snowflake-profile';
import { ReadSnowflakeProfiles } from '../snowflake-profile/read-snowflake-profiles';
import { SnowflakeProfile } from '../entities/snowflake-profile';

export interface QuerySnowflakeRequestDto {
  query: string;
  targetOrganizationId?: string;
}

export interface QuerySnowflakeAuthDto {
  callerOrganizationId?: string;
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
  readonly #snowflakeApiRepo: ISnowflakeApiRepo;

  readonly #readSnowflakeProfile: ReadSnowflakeProfile;

  readonly #readSnowflakeProfiles: ReadSnowflakeProfiles;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(
    snowflakeApiRepo: ISnowflakeApiRepo,
    readSnowflakeProfile: ReadSnowflakeProfile,
    readSnowflakeProfiles: ReadSnowflakeProfiles
  ) {
    this.#snowflakeApiRepo = snowflakeApiRepo;
    this.#readSnowflakeProfile = readSnowflakeProfile;
    this.#readSnowflakeProfiles = readSnowflakeProfiles;
  }

  #getSnowflakeProfile = async (
    organizationId: string
  ): Promise<SnowflakeProfile> => {
    const readSnowflakeProfileResult = await this.#readSnowflakeProfile.execute(
      null,
      {
        callerOrganizationId: organizationId,
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

      this.#dbConnection = dbConnection;

      this.#dbEncryption = dbEncryption;


      let snowflakeProfiles: SnowflakeProfile[];
      if(auth.isSystemInternal && request.targetOrganizationId)
        snowflakeProfiles = [await this.#getSnowflakeProfile(request.targetOrganizationId)];
      else if (auth.isSystemInternal)
        snowflakeProfiles = await this.#getSnowflakeProfiles(auth.isSystemInternal);
      else if (auth.callerOrganizationId)
        snowflakeProfiles = [await this.#getSnowflakeProfile(auth.callerOrganizationId)];
      else 
        throw new Error('Unhandled authorization');

      const snowflakeQuery: {[key: string]: any[]} = {};
      
      await Promise.all(
        snowflakeProfiles.map(async (profile) => {
          const queryResult = await this.#snowflakeApiRepo.runQuery(
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
