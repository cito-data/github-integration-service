import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import {
  ISnowflakeProfileRepo,
  SnowflakeProfileUpdateDto,
} from './i-snowflake-profile-repo';
import { ReadSnowflakeProfile } from './read-snowflake-profile';

export interface UpdateSnowflakeProfileRequestDto {
  accountId?: string;
  username?: string;
  password?: string;
  warehouseName?: string;
}

export interface UpdateSnowflakeProfileAuthDto {
  callerOrgId: string;
  isSystemInternal: boolean;
}

export type UpdateSnowflakeProfileResponseDto = Result<string>;

export class UpdateSnowflakeProfile
  implements
    IUseCase<
      UpdateSnowflakeProfileRequestDto,
      UpdateSnowflakeProfileResponseDto,
      UpdateSnowflakeProfileAuthDto,
      DbConnection
    >
{
  readonly #snowflakeProfileRepo: ISnowflakeProfileRepo;

  readonly #readSnowflakeProfile: ReadSnowflakeProfile;

  #dbConnection: DbConnection;

  constructor(
    readSnowflakeProfile: ReadSnowflakeProfile,
    snowflakeProfileRepo: ISnowflakeProfileRepo
  ) {
    this.#readSnowflakeProfile = readSnowflakeProfile;
    this.#snowflakeProfileRepo = snowflakeProfileRepo;
  }

  async execute(
    request: UpdateSnowflakeProfileRequestDto,
    auth: UpdateSnowflakeProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<UpdateSnowflakeProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const readSnowflakeProfileResult =
        await this.#readSnowflakeProfile.execute(
          {},
          {
            callerOrgId: auth.callerOrgId,
            isSystemInternal: auth.isSystemInternal,
          },
          this.#dbConnection
        );

      if (!readSnowflakeProfileResult.success)
        throw new Error('No such snowflake profile found');
      if (!readSnowflakeProfileResult.value)
        throw new Error('Snowflake profile retrieval went wrong');

      if (readSnowflakeProfileResult.value.organizationId !== auth.callerOrgId)
        throw new Error('Not allowed to perform action');

      const updateResult = await this.#snowflakeProfileRepo.updateOne(
        readSnowflakeProfileResult.value.id,
        this.#buildUpdateDto(request),
        this.#dbConnection
      );

      return Result.ok(updateResult);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }

  #buildUpdateDto = (
    request: UpdateSnowflakeProfileRequestDto
  ): SnowflakeProfileUpdateDto => ({ ...request });
}
