// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateSnowflakeProfile,
  CreateSnowflakeProfileAuthDto,
  CreateSnowflakeProfileRequestDto,
  CreateSnowflakeProfileResponseDto,
} from '../../../domain/snowflake-profile/create-snowflake-profile';
import { buildSnowflakeProfileDto } from '../../../domain/snowflake-profile/snowflake-profile-dto';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateSnowflakeProfileController extends BaseController {
  readonly #createSnowflakeProfile: CreateSnowflakeProfile;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    createSnowflakeProfile: CreateSnowflakeProfile,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#createSnowflakeProfile = createSnowflakeProfile;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): CreateSnowflakeProfileRequestDto => ({
    accountId: httpRequest.body.accountId,
    username: httpRequest.body.username,
    password: httpRequest.body.password,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): CreateSnowflakeProfileAuthDto => ({
    callerOrganizationId: userAccountInfo.callerOrganizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateSnowflakeProfileController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await CreateSnowflakeProfileController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return CreateSnowflakeProfileController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateSnowflakeProfileRequestDto =
        this.#buildRequestDto(req);
      const authDto: CreateSnowflakeProfileAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: CreateSnowflakeProfileResponseDto =
        await this.#createSnowflakeProfile.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection,
          this.#dbo.encryption
        );

      if (!useCaseResult.success) {
        return CreateSnowflakeProfileController.badRequest(
          res,
          useCaseResult.error
        );
      }

      const resultValue = useCaseResult.value
        ? buildSnowflakeProfileDto(useCaseResult.value)
        : useCaseResult.value;

      return CreateSnowflakeProfileController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return CreateSnowflakeProfileController.fail(res, error);
      if (error instanceof Error)
        return CreateSnowflakeProfileController.fail(res, error);
      return CreateSnowflakeProfileController.fail(
        res,
        'Unknown error occured'
      );
    }
  }
}
