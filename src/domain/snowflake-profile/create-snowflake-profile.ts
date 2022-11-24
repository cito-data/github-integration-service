import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { SnowflakeProfile } from '../entities/snowflake-profile';
import { ISnowflakeProfileRepo } from './i-snowflake-profile-repo';
import { ReadSnowflakeProfile } from './read-snowflake-profile';

export interface CreateSnowflakeProfileRequestDto {
  accountId: string;
  username: string;
  password: string;
  warehouseName: string;
}

export interface CreateSnowflakeProfileAuthDto {
  callerOrgId: string;
  isSystemInternal: boolean;
}

export type CreateSnowflakeProfileResponseDto = Result<SnowflakeProfile>;

export class CreateSnowflakeProfile
  implements
    IUseCase<
      CreateSnowflakeProfileRequestDto,
      CreateSnowflakeProfileResponseDto,
      CreateSnowflakeProfileAuthDto,
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
    request: CreateSnowflakeProfileRequestDto,
    auth: CreateSnowflakeProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateSnowflakeProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const snowflakeProfile = SnowflakeProfile.create({
        id: new ObjectId().toHexString(),
        organizationId: auth.callerOrgId,
        accountId: request.accountId.replace('.', '-'),
        username: request.username,
        password: request.password,
        warehouseName: request.warehouseName,
      });

      const readSnowflakeProfileResult =
        await this.#readSnowflakeProfile.execute(
          {},
          {
            callerOrgId: auth.callerOrgId,
            isSystemInternal: auth.isSystemInternal,
          },
          this.#dbConnection
        );

      if (
        readSnowflakeProfileResult.success &&
        readSnowflakeProfileResult.value
      )
        throw new Error('SnowflakeProfile already exists');

      await this.#snowflakeProfileRepo.insertOne(
        snowflakeProfile,
        this.#dbConnection
      );

      return Result.ok(snowflakeProfile);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
