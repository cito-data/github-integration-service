import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { SnowflakeProfile } from '../entities/snowflake-profile';
import { ISnowflakeProfileRepo } from './i-snowflake-profile-repo';
import { ReadSnowflakeProfile } from './read-snowflake-profile';

export interface CreateSnowflakeProfileRequestDto {
  accountId: string;
  username: string;
  password: string;
}

export interface CreateSnowflakeProfileAuthDto {
  organizationId: string;
}

export type CreateSnowflakeProfileResponseDto = Result<SnowflakeProfile>;

export class CreateSnowflakeProfile
  implements
    IUseCase<
      CreateSnowflakeProfileRequestDto,
      CreateSnowflakeProfileResponseDto,
      CreateSnowflakeProfileAuthDto,
      DbConnection,
      DbEncryption
    >
{
  readonly #snowflakeProfileRepo: ISnowflakeProfileRepo;

  readonly #readSnowflakeProfile: ReadSnowflakeProfile;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

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
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<CreateSnowflakeProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;
      this.#dbEncryption = dbEncryption;    

      const snowflakeProfile = SnowflakeProfile.create({
        id: new ObjectId().toHexString(),
        organizationId: auth.organizationId,
        accountId: request.accountId,
        username: request.username,
        password: request.password,
      });

      const readSnowflakeProfileResult =
        await this.#readSnowflakeProfile.execute(
         null 
         ,
          { organizationId: auth.organizationId },
          this.#dbConnection,
          this.#dbEncryption
        );

      if (readSnowflakeProfileResult.success)
        throw new Error('SnowflakeProfile already exists');

      await this.#snowflakeProfileRepo.insertOne(
        snowflakeProfile,
        this.#dbConnection,
        this.#dbEncryption
      );

      return Result.ok(snowflakeProfile);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
