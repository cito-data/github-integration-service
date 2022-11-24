import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { SlackProfile } from '../entities/slack-profile';
import { ISlackProfileRepo } from './i-slack-profile-repo';
import { ReadSlackProfile } from './read-slack-profile';

export interface CreateSlackProfileRequestDto {
  channelId: string;
  channelName: string;
  accessToken: string;
}

export interface CreateSlackProfileAuthDto {
  callerOrgId: string;
}

export type CreateSlackProfileResponseDto = Result<SlackProfile>;

export class CreateSlackProfile
  implements
    IUseCase<
      CreateSlackProfileRequestDto,
      CreateSlackProfileResponseDto,
      CreateSlackProfileAuthDto,
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
    request: CreateSlackProfileRequestDto,
    auth: CreateSlackProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateSlackProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const slackProfile = SlackProfile.create({
        id: new ObjectId().toHexString(),
        organizationId: auth.callerOrgId,
        channelId: request.channelId,
        channelName: request.channelName,
        accessToken: request.accessToken,
      });

      const readSlackProfileResult = await this.#readSlackProfile.execute(
        null,
        { callerOrgId: auth.callerOrgId },
        this.#dbConnection
      );

      if (readSlackProfileResult.success && readSlackProfileResult.value)
        throw new Error('Slack profile already exists');

      await this.#slackProfileRepo.insertOne(slackProfile, this.#dbConnection);

      return Result.ok(slackProfile);
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
