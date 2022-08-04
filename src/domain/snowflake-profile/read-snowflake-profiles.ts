import { SnowflakeProfile } from '../entities/snowflake-profile';
import { DbConnection, DbEncryption } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ISnowflakeProfileRepo } from './i-snowflake-profile-repo';

export type ReadSnowflakeProfilesRequestDto = null;

export interface ReadSnowflakeProfilesAuthDto {
  isAdmin: boolean;
}

export type ReadSnowflakeProfilesResponseDto = Result<SnowflakeProfile[]>;

export class ReadSnowflakeProfiles
  implements
    IUseCase<
      ReadSnowflakeProfilesRequestDto,
      ReadSnowflakeProfilesResponseDto,
      ReadSnowflakeProfilesAuthDto,
      DbConnection,
      DbEncryption
    >
{
  readonly #snowflakeprofileRepo: ISnowflakeProfileRepo;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(snowflakeprofileRepo: ISnowflakeProfileRepo) {
    this.#snowflakeprofileRepo = snowflakeprofileRepo;
  }

  async execute(
    request: ReadSnowflakeProfilesRequestDto,
    auth: ReadSnowflakeProfilesAuthDto,
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<ReadSnowflakeProfilesResponseDto> {
    try {
      if (!auth.isAdmin) throw new Error('Not authorized to perform action');

      this.#dbConnection = dbConnection;

      this.#dbEncryption = dbEncryption;

      const snowflakeprofiles: SnowflakeProfile[] =
        await this.#snowflakeprofileRepo.all(
          this.#dbConnection, 
        this.#dbEncryption
          
        );
      if (!snowflakeprofiles)
        throw new Error(`Queried snowflakeprofiles do not exist`);

      return Result.ok(snowflakeprofiles);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
