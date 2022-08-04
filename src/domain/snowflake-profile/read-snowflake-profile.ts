import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ISnowflakeProfileRepo } from './i-snowflake-profile-repo';
import { SnowflakeProfile } from '../entities/snowflake-profile';
import { DbConnection, DbEncryption } from '../services/i-db';

export type  ReadSnowflakeProfileRequestDto = null

export interface ReadSnowflakeProfileAuthDto {
  organizationId: string;
}

export type ReadSnowflakeProfileResponseDto = Result<SnowflakeProfile>;

export class ReadSnowflakeProfile
  implements
    IUseCase<
      ReadSnowflakeProfileRequestDto,
      ReadSnowflakeProfileResponseDto,
      ReadSnowflakeProfileAuthDto,
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
    request: ReadSnowflakeProfileRequestDto,
    auth: ReadSnowflakeProfileAuthDto,
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<ReadSnowflakeProfileResponseDto> {
    try {
      // todo -replace
      console.log(auth);

      this.#dbConnection = dbConnection;

      this.#dbEncryption = dbEncryption;

      const snowflakeProfile = await this.#snowflakeProfileRepo.findOne(
        auth.organizationId,
        this.#dbConnection,
        this.#dbEncryption
      );
      if (!snowflakeProfile)
        throw new Error(`SnowflakeProfile with id ${auth.organizationId} does not exist`);

      // if (snowflakeProfile.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(snowflakeProfile);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
