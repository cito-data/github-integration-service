import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ISnowflakeProfileRepo } from './i-snowflake-profile-repo';
import { SnowflakeProfile } from '../entities/snowflake-profile';
import { DbConnection } from '../services/i-db';

export type ReadSnowflakeProfileRequestDto = { targetOrgId?: string };

export interface ReadSnowflakeProfileAuthDto {
  callerOrgId?: string;
  isSystemInternal: boolean;
}

export type ReadSnowflakeProfileResponseDto = Result<
  SnowflakeProfile | undefined
>;

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
    if (auth.isSystemInternal && !request.targetOrgId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Caller organization id missing');
    if (!request.targetOrgId && !auth.callerOrgId)
      throw new Error('No organization Id instance provided');
    if (request.targetOrgId && auth.callerOrgId)
      throw new Error('callerOrgId and targetOrgId provided. Not allowed');

    this.#dbConnection = dbConnection;

    let orgId: string;
    if (auth.callerOrgId) orgId = auth.callerOrgId;
    else if (request.targetOrgId) orgId = request.targetOrgId;
    else throw new Error('Missing org id');

    try {
      const snowflakeProfile = await this.#snowflakeProfileRepo.findOne(
        orgId,
        this.#dbConnection
      );
      if (!snowflakeProfile) return Result.ok(undefined);

      return Result.ok(snowflakeProfile);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
