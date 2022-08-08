import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { SlackProfile } from '../entities/slack-profile';
import { ISlackProfileRepo } from './i-slack-profile-repo';
import { ReadSlackProfile } from './read-slack-profile';

export interface CreateSlackProfileRequestDto {
channelId: string,
accessToken: string, 
workspaceId: string,
}

export interface CreateSlackProfileAuthDto {
  organizationId: string;
}

export type CreateSlackProfileResponseDto = Result<SlackProfile>;

export class CreateSlackProfile
  implements
    IUseCase<
      CreateSlackProfileRequestDto,
      CreateSlackProfileResponseDto,
      CreateSlackProfileAuthDto,
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
    request: CreateSlackProfileRequestDto,
    auth: CreateSlackProfileAuthDto,
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<CreateSlackProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;
      this.#dbEncryption = dbEncryption;    

      const slackProfile = SlackProfile.create({
        id: new ObjectId().toHexString(),
        organizationId: auth.organizationId,
        channelId: request.channelId,
        workspaceId: request.workspaceId,
        accessToken: request.accessToken
      });

      const readSlackProfileResult =
        await this.#readSlackProfile.execute(
         null 
         ,
          { organizationId: auth.organizationId },
          this.#dbConnection,
          this.#dbEncryption
        );

      if (readSlackProfileResult.success)
        throw new Error('Slack profile already exists');

      await this.#slackProfileRepo.insertOne(
        slackProfile,
        this.#dbConnection,
        this.#dbEncryption
      );

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(slackProfile);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
