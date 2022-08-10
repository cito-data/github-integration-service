import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { ISlackApiRepo } from './i-slack-api-repo';
import { ReadSlackProfile } from '../slack-profile/read-slack-profile';
import { SlackProfile } from '../entities/slack-profile';

export interface SendSlackAlertRequestDto {
  message: string;
}

export interface SendSlackAlertAuthDto {
  organizationId: string;
}

export type SendSlackAlertResponseDto = Result<null>;

export class SendSlackAlert
  implements
    IUseCase<
      SendSlackAlertRequestDto,
      SendSlackAlertResponseDto,
      SendSlackAlertAuthDto,
      DbConnection,
      DbEncryption
    >
{
  readonly #slackApiRepo: ISlackApiRepo;

  readonly #readSlackProfile: ReadSlackProfile;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(slackApiRepo: ISlackApiRepo, readSlackProfile: ReadSlackProfile) {
    this.#slackApiRepo = slackApiRepo;
    this.#readSlackProfile = readSlackProfile;
  }

  #getSlackProfile = async (organizationId: string): Promise<SlackProfile> => {
    const readSlackProfileResult = await this.#readSlackProfile.execute(
      null,
      {
        organizationId,
      },
      this.#dbConnection,
      this.#dbEncryption
    );

    if (!readSlackProfileResult.success)
      throw new Error(readSlackProfileResult.error);
    if (!readSlackProfileResult.value)
      throw new Error('SlackProfile does not exist');

    return readSlackProfileResult.value;
  };

  async execute(
    request: SendSlackAlertRequestDto,
    auth: SendSlackAlertAuthDto,
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<SendSlackAlertResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      this.#dbEncryption = dbEncryption;

      const slackProfile = await this.#getSlackProfile(auth.organizationId);

      await this.#slackApiRepo.sendAlert(
        slackProfile.accessToken,
        slackProfile.channelName,
        request.message
      );

      // if (slackQuery.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(null);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
