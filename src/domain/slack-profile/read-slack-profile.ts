import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ISlackProfileRepo } from './i-slack-profile-repo';
import { SlackProfile } from '../entities/slack-profile';
import { DbConnection } from '../services/i-db';

export type ReadSlackProfileRequestDto = null;

export interface ReadSlackProfileAuthDto {
  callerOrganizationId: string;
}

export type ReadSlackProfileResponseDto = Result<SlackProfile|undefined>;

export class ReadSlackProfile
  implements
    IUseCase<
      ReadSlackProfileRequestDto,
      ReadSlackProfileResponseDto,
      ReadSlackProfileAuthDto,
      DbConnection
    >
{
  readonly #slackProfileRepo: ISlackProfileRepo;

  #dbConnection: DbConnection;

  constructor(slackProfileRepo: ISlackProfileRepo) {
    this.#slackProfileRepo = slackProfileRepo;
  }

  async execute(
    request: ReadSlackProfileRequestDto,
    auth: ReadSlackProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<ReadSlackProfileResponseDto> {
    try {
      // todo -replace
      console.log(auth);

      this.#dbConnection = dbConnection;

      const slackProfile = await this.#slackProfileRepo.findOne(
        auth.callerOrganizationId,
        this.#dbConnection
      );
      if (!slackProfile)
        return Result.ok(undefined);

      if (slackProfile.organizationId !== auth.callerOrganizationId)
        throw new Error('Not authorized to perform action');

      return Result.ok(slackProfile);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
