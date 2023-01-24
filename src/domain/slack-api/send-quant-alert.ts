import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { ISlackApiRepo, QuantAlertMsgConfig } from './i-slack-api-repo';
import { ReadSlackProfile } from '../slack-profile/read-slack-profile';
import { SlackProfile } from '../entities/slack-profile';

export interface SendSlackQuantAlertRequestDto {
  messageConfig: QuantAlertMsgConfig;
  targetOrgId: string;
}

export interface SendSlackQuantAlertAuthDto {
  isSystemInternal: boolean;
}

export type SendSlackQuantAlertResponseDto = Result<null>;

export class SendSlackQuantAlert
  implements
    IUseCase<
      SendSlackQuantAlertRequestDto,
      SendSlackQuantAlertResponseDto,
      SendSlackQuantAlertAuthDto,
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
        callerOrgId: organizationId,
      },
      this.#dbConnection
    );

    if (!readSlackProfileResult.success)
      throw new Error(readSlackProfileResult.error);
    if (!readSlackProfileResult.value)
      throw new Error('SlackProfile does not exist');

    return readSlackProfileResult.value;
  };

  async execute(
    request: SendSlackQuantAlertRequestDto,
    auth: SendSlackQuantAlertAuthDto,
    dbConnection: DbConnection
  ): Promise<SendSlackQuantAlertResponseDto> {
    try {
      if (!auth.isSystemInternal)
        throw new Error('Not authorized to perform action');

      this.#dbConnection = dbConnection;

      const slackProfile = await this.#getSlackProfile(request.targetOrgId);

      await this.#slackApiRepo.sendQuantAlert(
        slackProfile.accessToken,
        slackProfile.channelName,
        request.messageConfig
      );

      return Result.ok(null);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
