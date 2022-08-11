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
  readonly #snowflakeProfileRepo: ISnowflakeProfileRepo;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(snowflakeProfileRepo: ISnowflakeProfileRepo) {
    this.#snowflakeProfileRepo = snowflakeProfileRepo;
  }

  async execute(
    request: ReadSnowflakeProfilesRequestDto,
    auth: ReadSnowflakeProfilesAuthDto,
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<ReadSnowflakeProfilesResponseDto> {
    if (!auth.isAdmin) throw new Error('Not authorized to perform action');

    try {
      this.#dbConnection = dbConnection;

      this.#dbEncryption = dbEncryption;

      const snowflakeProfiles: SnowflakeProfile[] =
        await this.#snowflakeProfileRepo.all(
          this.#dbConnection, 
        this.#dbEncryption
          
        );
      if (!snowflakeProfiles)
        throw new Error(`Queried snowflakeProfiles do not exist`);

      return Result.ok(snowflakeProfiles);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
