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
    const { targetOrgId } = httpRequest.query;

    if (targetOrgId && typeof targetOrgId !== 'string')
      throw new Error('Query param targetOrgId need to by of type string');

    return {
      targetOrgId,
    };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): ReadSnowflakeProfileAuthDto => ({
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

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
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return ReadSnowflakeProfileController.badRequest(res);
      }

      const resultValue = useCaseResult.value
        ? buildSnowflakeProfileDto(useCaseResult.value)
        : useCaseResult.value;

      return ReadSnowflakeProfileController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return ReadSnowflakeProfileController.fail(
        res,
        'Unknown internal error occurred'
      );
    }
  }
}
