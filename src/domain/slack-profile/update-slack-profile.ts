import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
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
  organizationId: string;
}

export type UpdateSlackProfileResponseDto = Result<string>;

export class UpdateSlackProfile
  implements
    IUseCase<
      UpdateSlackProfileRequestDto,
      UpdateSlackProfileResponseDto,
      UpdateSlackProfileAuthDto,
      DbConnection,
      DbEncryption
    >
{
  readonly #slackProfileRepo: ISlackProfileRepo;

  readonly #readSlackProfile: ReadSlackProfile;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

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
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<UpdateSlackProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;
      this.#dbEncryption = dbEncryption;

      const readSlackProfileResult = await this.#readSlackProfile.execute(
        null,
        { organizationId: auth.organizationId },
        this.#dbConnection,
        this.#dbEncryption
      );

      if (!readSlackProfileResult.success)
        throw new Error('No such slack profile found');
      if (!readSlackProfileResult.value)
        throw new Error('Slack profile retrieval went wrong');

      if (readSlackProfileResult.value.organizationId !== auth.organizationId)
        throw new Error('Not allowed to perform action');

      const updateResult = await this.#slackProfileRepo.updateOne(
        readSlackProfileResult.value.id,
        this.#buildUpdateDto(request),
        this.#dbConnection,
        this.#dbEncryption
      );

      return Result.ok(updateResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }

  #buildUpdateDto = (
    request: UpdateSlackProfileRequestDto
  ): SlackProfileUpdateDto => ({ ...request });
}
