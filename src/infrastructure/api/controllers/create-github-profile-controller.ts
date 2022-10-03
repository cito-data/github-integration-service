// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateGithubProfile,
  CreateGithubProfileAuthDto,
  CreateGithubProfileRequestDto,
  CreateGithubProfileResponseDto,
} from '../../../domain/github-profile/create-github-profile';
import { buildGithubProfileDto } from '../../../domain/github-profile/github-profile-dto';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateGithubProfileController extends BaseController {
  readonly #createGithubProfile: CreateGithubProfile;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    createGithubProfile: CreateGithubProfile,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#createGithubProfile = createGithubProfile;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): CreateGithubProfileRequestDto => ({
    installationId: httpRequest.body.installationId,
    organizationId: httpRequest.body.organizationId,
    repositoryNames: httpRequest.body.repositoryNames,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): CreateGithubProfileAuthDto => {
    if (!userAccountInfo.callerOrganizationId) throw new Error('Unauthorized');

    return {
      callerOrganizationId: userAccountInfo.callerOrganizationId,
      isSystemInternal: userAccountInfo.isSystemInternal,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateGithubProfileController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await CreateGithubProfileController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return CreateGithubProfileController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateGithubProfileRequestDto =
        this.#buildRequestDto(req);
      const authDto: CreateGithubProfileAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: CreateGithubProfileResponseDto =
        await this.#createGithubProfile.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return CreateGithubProfileController.badRequest(res);
      }

      const resultValue = useCaseResult.value
        ? buildGithubProfileDto(useCaseResult.value)
        : useCaseResult.value;

      return CreateGithubProfileController.ok(
        res,
        resultValue,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      return CreateGithubProfileController.fail(
        res,
        'Unknown internal error occured'
      );
    }
  }
}
