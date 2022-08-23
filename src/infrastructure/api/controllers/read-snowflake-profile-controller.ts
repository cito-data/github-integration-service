// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { buildSnowflakeProfileDto } from '../../../domain/snowflake-profile/snowflake-profile-dto';
import {
  ReadSnowflakeProfile,
  ReadSnowflakeProfileAuthDto,
  ReadSnowflakeProfileRequestDto,
  ReadSnowflakeProfileResponseDto,
} from '../../../domain/snowflake-profile/read-snowflake-profile';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';

export default class ReadSnowflakeProfileController extends BaseController {
  readonly #readSnowflakeProfile: ReadSnowflakeProfile;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    readSnowflakeProfile: ReadSnowflakeProfile,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#readSnowflakeProfile = readSnowflakeProfile;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadSnowflakeProfileRequestDto => {
    console.log(httpRequest.params);
    return null;
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): ReadSnowflakeProfileAuthDto => {
    if (!userAccountInfo.callerOrganizationId) throw new Error('Unauthorized');

    return {
      callerOrganizationId: userAccountInfo.callerOrganizationId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadSnowflakeProfileController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadSnowflakeProfileController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadSnowflakeProfileController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadSnowflakeProfileRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadSnowflakeProfileAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadSnowflakeProfileResponseDto =
        await this.#readSnowflakeProfile.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection,
          this.#dbo.encryption
        );

      if (!useCaseResult.success) {
        return ReadSnowflakeProfileController.badRequest(
          res,
          useCaseResult.error
        );
      }

      const resultValue = useCaseResult.value
        ? buildSnowflakeProfileDto(useCaseResult.value)
        : useCaseResult.value;

      return ReadSnowflakeProfileController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'string')
        return ReadSnowflakeProfileController.fail(res, error);
      if (error instanceof Error)
        return ReadSnowflakeProfileController.fail(res, error);
      return ReadSnowflakeProfileController.fail(res, 'Unknown error occured');
    }
  }
}
