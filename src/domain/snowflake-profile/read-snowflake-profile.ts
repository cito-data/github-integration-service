import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ISnowflakeProfileRepo } from './i-snowflake-profile-repo';
import { SnowflakeProfile } from '../entities/snowflake-profile';
import { DbConnection } from '../services/i-db';

export type ReadSnowflakeProfileRequestDto = null;

export interface ReadSnowflakeProfileAuthDto {
  callerOrganizationId: string;
}

export type ReadSnowflakeProfileResponseDto = Result<SnowflakeProfile>;

export class ReadSnowflakeProfile
  implements
    IUseCase<
      ReadSnowflakeProfileRequestDto,
      ReadSnowflakeProfileResponseDto,
      ReadSnowflakeProfileAuthDto,
      DbConnection
    >
{
  readonly #snowflakeProfileRepo: ISnowflakeProfileRepo;

  #dbConnection: DbConnection;

  constructor(snowflakeProfileRepo: ISnowflakeProfileRepo) {
    this.#snowflakeProfileRepo = snowflakeProfileRepo;
  }

  async execute(
    request: ReadSnowflakeProfileRequestDto,
    auth: ReadSnowflakeProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<ReadSnowflakeProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const snowflakeProfile = await this.#snowflakeProfileRepo.findOne(
        auth.callerOrganizationId,
        this.#dbConnection
      );
      if (!snowflakeProfile)
        throw new Error(
          `SnowflakeProfile with id ${auth.callerOrganizationId} does not exist`
        );

      if (snowflakeProfile.organizationId !== auth.callerOrganizationId)
        throw new Error('Not authorized to perform action');

      return Result.ok(snowflakeProfile);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
