import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import {
  Binds,
  ISnowflakeApiRepo,
  SnowflakeEntity,
} from './i-snowflake-api-repo';
import { ReadSnowflakeProfile } from '../snowflake-profile/read-snowflake-profile';
import { SnowflakeProfile } from '../entities/snowflake-profile';
import { appConfig } from '../../config';

export interface QuerySnowflakeRequestDto {
  query: string;
  binds: Binds;
  targetOrgId?: string;
}

export interface QuerySnowflakeAuthDto {
  callerOrgId?: string;
  isSystemInternal: boolean;
}

export type QuerySnowflakeResponseDto = Result<SnowflakeEntity[]>;

export class QuerySnowflake
  implements
    IUseCase<
      QuerySnowflakeRequestDto,
      QuerySnowflakeResponseDto,
      QuerySnowflakeAuthDto,
      DbConnection
    >
{
  readonly #snowflakeApiRepo: ISnowflakeApiRepo;

  readonly #readSnowflakeProfile: ReadSnowflakeProfile;

  #dbConnection: DbConnection;

  constructor(
    snowflakeApiRepo: ISnowflakeApiRepo,
    readSnowflakeProfile: ReadSnowflakeProfile
  ) {
    this.#snowflakeApiRepo = snowflakeApiRepo;
    this.#readSnowflakeProfile = readSnowflakeProfile;
  }

  #getSnowflakeProfile = async (
    auth: QuerySnowflakeAuthDto,
    targetOrgId?: string
  ): Promise<SnowflakeProfile> => {
    const readSnowflakeProfileResult = await this.#readSnowflakeProfile.execute(
      { targetOrgId },
      auth,
      this.#dbConnection
    );

    if (!readSnowflakeProfileResult.success)
      throw new Error(readSnowflakeProfileResult.error);
    if (!readSnowflakeProfileResult.value)
      throw new Error('SnowflakeProfile does not exist');

    return readSnowflakeProfileResult.value;
  };

  async execute(
    request: QuerySnowflakeRequestDto,
    auth: QuerySnowflakeAuthDto,
    dbConnection: DbConnection
  ): Promise<QuerySnowflakeResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      let snowflakeProfiles: SnowflakeProfile[];
      if (auth.isSystemInternal && request.targetOrgId)
        snowflakeProfiles = [
          await this.#getSnowflakeProfile(auth, request.targetOrgId),
        ];
      else if (auth.callerOrgId)
        snowflakeProfiles = [
          await this.#getSnowflakeProfile(auth, auth.callerOrgId),
        ];
      else throw new Error('Unhandled authorization');

      const snowflakeQuery: { [key: string]: any[] } = {};

      await Promise.all(
        snowflakeProfiles.map(async (profile) => {
          const queryResult = await this.#snowflakeApiRepo.runQuery(
            request.query,
            request.binds,
            {
              ...profile,
              citoApplicationName: appConfig.snowflake.applicationName,
            }
          );

          const queryResultBaseMsg = `AcccountId: ${
            profile.accountId
          } \nOrganizationId: ${
            profile.organizationId
          } \n${request.query.substring(0, 1000)}${
            request.query.length > 1000 ? '...' : ''
          }`;

          if (!queryResult.success && auth.isSystemInternal)
            console.error(
              `Sf query failed \n${queryResultBaseMsg} \nError msg: ${queryResult.error}`
            );
          else if (!queryResult.success)
            throw new Error(
              `Sf query failed \n${queryResultBaseMsg} \nError msg: ${queryResult.error}`
            );
          else console.log(`Sf query succeeded \n${queryResultBaseMsg}`);

          const value =
            queryResult.success && queryResult.value
              ? JSON.parse(
                  JSON.stringify(queryResult.value).replace(
                    /[", ']null[", ']/g,
                    'null'
                  )
                )
              : [];

          snowflakeQuery[profile.organizationId] = value;
        })
      );

      // if (snowflakeQuery.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(snowflakeQuery);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return Result.fail('');
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
