import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { ISlackApiRepo } from './i-slack-api-repo';
import { ReadSlackProfile } from '../slack-profile/read-slack-profile';
import { SlackProfile } from '../entities/slack-profile';
import { SlackConversationInfo } from '../value-types/slack-conversation-info';

export type GetSlackConversationsRequestDto = null

export interface GetSlackConversationsAuthDto {
  callerOrganizationId: string;
}

export type GetSlackConversationsResponseDto = Result<SlackConversationInfo[]>;

export class GetSlackConversations
  implements
    IUseCase<
      GetSlackConversationsRequestDto,
      GetSlackConversationsResponseDto,
      GetSlackConversationsAuthDto,
      DbConnection
    >
{
  readonly #slackApiRepo: ISlackApiRepo;

  readonly #readSlackProfile: ReadSlackProfile;

  #dbConnection: DbConnection;


  constructor(slackApiRepo: ISlackApiRepo, readSlackProfile: ReadSlackProfile) {
    this.#slackApiRepo = slackApiRepo;
    this.#readSlackProfile = readSlackProfile;
  }

  #getSlackProfile = async (organizationId: string): Promise<SlackProfile> => {
    const readSlackProfileResult = await this.#readSlackProfile.execute(
      null,
      {
        callerOrganizationId: organizationId,
      },
      this.#dbConnection,
    );

    if (!readSlackProfileResult.success)
      throw new Error(readSlackProfileResult.error);
    if (!readSlackProfileResult.value)
      throw new Error('SlackProfile does not exist');

    return readSlackProfileResult.value;
  };

  async execute(
    request: GetSlackConversationsRequestDto,
    auth: GetSlackConversationsAuthDto,
    dbConnection: DbConnection,
  ): Promise<GetSlackConversationsResponseDto> {
    try {
      this.#dbConnection = dbConnection;


      const slackProfile = await this.#getSlackProfile(auth.callerOrganizationId);

      const conversations = await this.#slackApiRepo.getConversations(
        slackProfile.accessToken,
      );

      // if (slackQuery.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(conversations);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
