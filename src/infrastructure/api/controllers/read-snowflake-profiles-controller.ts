// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { buildSnowflakeProfileDto } from '../../../domain/snowflake-profile/snowflake-profile-dto';
import {
  ReadSnowflakeProfiles,
  ReadSnowflakeProfilesAuthDto,
  ReadSnowflakeProfilesRequestDto,
  ReadSnowflakeProfilesResponseDto,
} from '../../../domain/snowflake-profile/read-snowflake-profiles';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';

export default class ReadSnowflakeProfilesController extends BaseController {
  readonly #readSnowflakeProfiles: ReadSnowflakeProfiles;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    readSnowflakeProfiles: ReadSnowflakeProfiles,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#readSnowflakeProfiles = readSnowflakeProfiles;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): ReadSnowflakeProfilesRequestDto => {
    console.log(httpRequest.params);
    return null;
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): ReadSnowflakeProfilesAuthDto => ({
    isAdmin: userAccountInfo.isAdmin
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadSnowflakeProfilesController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadSnowflakeProfilesController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadSnowflakeProfilesController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if(!getUserAccountInfoResult.value.isAdmin)
          return ReadSnowflakeProfilesController.unauthorized(res, 'Not authorized to perform action');

      const requestDto: ReadSnowflakeProfilesRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadSnowflakeProfilesAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadSnowflakeProfilesResponseDto =
        await this.#readSnowflakeProfiles.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection,
          this.#dbo.encryption
        );

      if (!useCaseResult.success) {
        return ReadSnowflakeProfilesController.badRequest(
          res,
          useCaseResult.error
        );
      }
      if (!useCaseResult.value)
        return ReadSnowflakeProfilesController.fail(res, 'Internal error');

      const profileDtos = useCaseResult.value.map((element) =>
        buildSnowflakeProfileDto(element)
      );

      return ReadSnowflakeProfilesController.ok(res, profileDtos, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return ReadSnowflakeProfilesController.fail(res, error);
      if (error instanceof Error)
        return ReadSnowflakeProfilesController.fail(res, error);
      return ReadSnowflakeProfilesController.fail(res, 'Unknown error occured');
    }
  }
}
