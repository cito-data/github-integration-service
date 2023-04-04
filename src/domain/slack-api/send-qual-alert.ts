import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { ISlackApiRepo, QualAlertMsgConfig } from './i-slack-api-repo';
import { ReadSlackProfile } from '../slack-profile/read-slack-profile';
import { SlackProfile } from '../entities/slack-profile';

export interface SendSlackQualAlertRequestDto {
  messageConfig: QualAlertMsgConfig;
  targetOrgId: string;
}

export interface SendSlackQualAlertAuthDto {
  isSystemInternal: boolean;
}

export type SendSlackQualAlertResponseDto = Result<null>;

export class SendSlackQualAlert
  implements
    IUseCase<
      SendSlackQualAlertRequestDto,
      SendSlackQualAlertResponseDto,
      SendSlackQualAlertAuthDto,
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
    request: SendSlackQualAlertRequestDto,
    auth: SendSlackQualAlertAuthDto,
    dbConnection: DbConnection
  ): Promise<SendSlackQualAlertResponseDto> {
    try {
      if (!auth.isSystemInternal)
        throw new Error('Not authorized to perform action');

      this.#dbConnection = dbConnection;

      const slackProfile = await this.#getSlackProfile(request.targetOrgId);

      await this.#slackApiRepo.sendQualAlert(
        slackProfile.accessToken,
        slackProfile.channelId,
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
