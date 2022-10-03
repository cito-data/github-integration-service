import { SnowflakeProfile } from '../entities/snowflake-profile';
import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ISnowflakeProfileRepo } from './i-snowflake-profile-repo';

export type ReadSnowflakeProfilesRequestDto = null;

export interface ReadSnowflakeProfilesAuthDto {
  isSystemInternal: boolean;
}

export type ReadSnowflakeProfilesResponseDto = Result<SnowflakeProfile[]>;

export class ReadSnowflakeProfiles
  implements
    IUseCase<
      ReadSnowflakeProfilesRequestDto,
      ReadSnowflakeProfilesResponseDto,
      ReadSnowflakeProfilesAuthDto,
      DbConnection
    >
{
  readonly #snowflakeProfileRepo: ISnowflakeProfileRepo;

  #dbConnection: DbConnection;

  constructor(snowflakeProfileRepo: ISnowflakeProfileRepo) {
    this.#snowflakeProfileRepo = snowflakeProfileRepo;
  }

  async execute(
    request: ReadSnowflakeProfilesRequestDto,
    auth: ReadSnowflakeProfilesAuthDto,
    dbConnection: DbConnection
  ): Promise<ReadSnowflakeProfilesResponseDto> {
    try {
      if (!auth.isSystemInternal)
        throw new Error('Not authorized to perform action');

      this.#dbConnection = dbConnection;

      const snowflakeProfiles: SnowflakeProfile[] =
        await this.#snowflakeProfileRepo.all(this.#dbConnection);
      if (!snowflakeProfiles)
        throw new Error(`Queried snowflakeProfiles do not exist`);

      return Result.ok(snowflakeProfiles);
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
