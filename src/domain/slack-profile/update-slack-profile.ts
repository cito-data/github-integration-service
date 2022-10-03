import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import {
  ISlackProfileRepo,
  SlackProfileUpdateDto,
} from './i-slack-profile-repo';
import { ReadSlackProfile } from './read-slack-profile';

export interface UpdateSlackProfileRequestDto {
  channelId?: string;
  channelName?: string;
  accessToken?: string;
}

export interface UpdateSlackProfileAuthDto {
  callerOrganizationId: string;
}

export type UpdateSlackProfileResponseDto = Result<string>;

export class UpdateSlackProfile
  implements
    IUseCase<
      UpdateSlackProfileRequestDto,
      UpdateSlackProfileResponseDto,
      UpdateSlackProfileAuthDto,
      DbConnection
    >
{
  readonly #slackProfileRepo: ISlackProfileRepo;

  readonly #readSlackProfile: ReadSlackProfile;

  #dbConnection: DbConnection;

  constructor(
    readSlackProfile: ReadSlackProfile,
    slackProfileRepo: ISlackProfileRepo
  ) {
    this.#readSlackProfile = readSlackProfile;
    this.#slackProfileRepo = slackProfileRepo;
  }

  async execute(
    request: UpdateSlackProfileRequestDto,
    auth: UpdateSlackProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<UpdateSlackProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const readSlackProfileResult = await this.#readSlackProfile.execute(
        null,
        { callerOrganizationId: auth.callerOrganizationId },
        this.#dbConnection
      );

      if (!readSlackProfileResult.success)
        throw new Error('No such slack profile found');
      if (!readSlackProfileResult.value)
        throw new Error('Slack profile retrieval went wrong');

      if (
        readSlackProfileResult.value.organizationId !==
        auth.callerOrganizationId
      )
        throw new Error('Not allowed to perform action');

      const updateResult = await this.#slackProfileRepo.updateOne(
        readSlackProfileResult.value.id,
        this.#buildUpdateDto(request),
        this.#dbConnection
      );

      return Result.ok(updateResult);
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }

  #buildUpdateDto = (
    request: UpdateSlackProfileRequestDto
  ): SlackProfileUpdateDto => ({ ...request });
}
