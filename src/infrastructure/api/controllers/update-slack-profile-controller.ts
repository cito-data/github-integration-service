// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateSlackProfile,
  UpdateSlackProfileAuthDto,
  UpdateSlackProfileRequestDto,
  UpdateSlackProfileResponseDto,
} from '../../../domain/slack-profile/update-slack-profile';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class UpdateSlackProfileController extends BaseController {
  readonly #updateSlackProfile: UpdateSlackProfile;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    updateSlackProfile: UpdateSlackProfile,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#updateSlackProfile = updateSlackProfile;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): UpdateSlackProfileRequestDto => ({
    channelId: httpRequest.body.channelId || undefined,
    channelName: httpRequest.body.channelName || undefined,
    accessToken: httpRequest.body.accessToken || undefined,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): UpdateSlackProfileAuthDto => {
    if (!userAccountInfo.callerOrganizationId) throw new Error('Unauthorized');

    return {
      callerOrganizationId: userAccountInfo.callerOrganizationId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateSlackProfileController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await UpdateSlackProfileController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateSlackProfileController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateSlackProfileRequestDto =
        this.#buildRequestDto(req);
      const authDto: UpdateSlackProfileAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: UpdateSlackProfileResponseDto =
        await this.#updateSlackProfile.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection,
        );

      if (!useCaseResult.success) {
        return UpdateSlackProfileController.badRequest(
          res,
          
        );
      }

      return UpdateSlackProfileController.ok(
        res,
        useCaseResult.value,
        CodeHttp.OK
      );
    } catch (error: unknown) {
      return UpdateSlackProfileController.fail(res, 'Unknown internal error occured');
    }
  }
}
