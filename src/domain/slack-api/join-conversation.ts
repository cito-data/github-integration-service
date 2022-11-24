import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { ISlackApiRepo } from './i-slack-api-repo';
import { ReadSlackProfile } from '../slack-profile/read-slack-profile';

export type JoinSlackConversationRequestDto = {
  oldChannelId?: string;
  newChannelId: string;
  accessToken: string;
};

export interface JoinSlackConversationAuthDto {
  callerOrgId: string;
}

export type JoinSlackConversationResponseDto = Result<null>;

export class JoinSlackConversation
  implements
    IUseCase<
      JoinSlackConversationRequestDto,
      JoinSlackConversationResponseDto,
      JoinSlackConversationAuthDto,
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

  // #getSlackProfile = async (organizationId: string): Promise<SlackProfile> => {
  //   const readSlackProfileResult = await this.#readSlackProfile.execute(
  //     null,
  //     {
  //       callerOrgId: organizationId,
  //     },
  //     this.#dbConnection
  //   );

  //   if (!readSlackProfileResult.success)
  //     throw new Error(readSlackProfileResult.error);
  //   if (!readSlackProfileResult.value)
  //     throw new Error('SlackProfile does not exist');

  //   return readSlackProfileResult.value;
  // };

  async execute(
    request: JoinSlackConversationRequestDto,
    auth: JoinSlackConversationAuthDto,
    dbConnection: DbConnection
  ): Promise<JoinSlackConversationResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      if (request.oldChannelId)
        await this.#slackApiRepo.leaveConversation(
          request.accessToken,
          request.oldChannelId
        );

      await this.#slackApiRepo.joinConversation(
        request.accessToken,
        request.newChannelId
      );

      // if (slackQuery.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(null);
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
