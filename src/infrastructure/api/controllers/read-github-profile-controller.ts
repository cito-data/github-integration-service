// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { buildGithubProfileDto } from '../../../domain/github-profile/github-profile-dto';
import {
  ReadGithubProfile,
  ReadGithubProfileAuthDto,
  ReadGithubProfileRequestDto,
  ReadGithubProfileResponseDto,
} from '../../../domain/github-profile/read-github-profile';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';
import Result from '../../../domain/value-types/transient-types/result';

export default class ReadGithubProfileController extends BaseController {
  readonly #readGithubProfile: ReadGithubProfile;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    readGithubProfile: ReadGithubProfile,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#readGithubProfile = readGithubProfile;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): ReadGithubProfileRequestDto => ({
    targetOrgId:
      typeof httpRequest.query.organizationId === 'string'
        ? httpRequest.query.organizationId
        : undefined,
    installationId:
      typeof httpRequest.query.installationId === 'string'
        ? httpRequest.query.installationId
        : undefined,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): ReadGithubProfileAuthDto => ({
    callerOrgId: userAccountInfo.callerOrgId,
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadGithubProfileController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadGithubProfileController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadGithubProfileController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: ReadGithubProfileRequestDto =
        this.#buildRequestDto(req);
      const authDto: ReadGithubProfileAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: ReadGithubProfileResponseDto =
        await this.#readGithubProfile.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return ReadGithubProfileController.badRequest(res, );
      }

      const resultValue = useCaseResult.value
        ? buildGithubProfileDto(useCaseResult.value)
        : useCaseResult.value;

      return ReadGithubProfileController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return ReadGithubProfileController.fail(res, 'Unknown internal error occurred');
    }
  }
}
