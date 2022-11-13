// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { buildSlackProfileDto } from '../../../domain/slack-profile/slack-profile-dto';
import {
  ReadSlackProfile,
  ReadSlackProfileAuthDto,
  ReadSlackProfileRequestDto,
  ReadSlackProfileResponseDto,
} from '../../../domain/slack-profile/read-slack-profile';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';

export default class ReadSlackProfileController extends BaseController {
  readonly #readSlackProfile: ReadSlackProfile;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    readSlackProfile: ReadSlackProfile,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#readSlackProfile = readSlackProfile;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): ReadSlackProfileAuthDto => {
    if (!userAccountInfo.callerOrgId) throw new Error('Unauthorized');

    return {
      callerOrgId: userAccountInfo.callerOrgId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadSlackProfileController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadSlackProfileController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadSlackProfileController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadSlackProfileRequestDto = null;
      const authDto: ReadSlackProfileAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadSlackProfileResponseDto =
        await this.#readSlackProfile.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection,
        );

      if (!useCaseResult.success) {
        return ReadSlackProfileController.badRequest(res, );
      }

      const resultValue = useCaseResult.value
        ? buildSlackProfileDto(useCaseResult.value)
        : useCaseResult.value;

      return ReadSlackProfileController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return ReadSlackProfileController.fail(res, 'Unknown internal error occured');
    }
  }
}
