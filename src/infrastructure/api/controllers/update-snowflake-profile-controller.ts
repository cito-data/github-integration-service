// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  UpdateSnowflakeProfile,
  UpdateSnowflakeProfileAuthDto,
  UpdateSnowflakeProfileRequestDto,
  UpdateSnowflakeProfileResponseDto,
} from '../../../domain/snowflake-profile/update-snowflake-profile';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class UpdateSnowflakeProfileController extends BaseController {
  readonly #updateSnowflakeProfile: UpdateSnowflakeProfile;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    updateSnowflakeProfile: UpdateSnowflakeProfile,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#updateSnowflakeProfile = updateSnowflakeProfile;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): UpdateSnowflakeProfileRequestDto => ({
    accountId: httpRequest.body.accountId || undefined,
    username: httpRequest.body.username || undefined,
    password: httpRequest.body.password || undefined,
    warehouseName: httpRequest.body.warehouseName || undefined
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): UpdateSnowflakeProfileAuthDto => {
    if (!userAccountInfo.callerOrganizationId) throw new Error('Unauthorized');

    return {
      callerOrganizationId: userAccountInfo.callerOrganizationId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return UpdateSnowflakeProfileController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await UpdateSnowflakeProfileController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return UpdateSnowflakeProfileController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: UpdateSnowflakeProfileRequestDto =
        this.#buildRequestDto(req);
      const authDto: UpdateSnowflakeProfileAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: UpdateSnowflakeProfileResponseDto =
        await this.#updateSnowflakeProfile.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection,
        );

      if (!useCaseResult.success) {
        return UpdateSnowflakeProfileController.badRequest(
          res,
          useCaseResult.error
        );
      }

      return UpdateSnowflakeProfileController.ok(
        res,
        useCaseResult.value,
        CodeHttp.OK
      );
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return UpdateSnowflakeProfileController.fail(res, error);
      if (error instanceof Error)
        return UpdateSnowflakeProfileController.fail(res, error);
      return UpdateSnowflakeProfileController.fail(res, 'Unknown error occured');
    }
  }
}
