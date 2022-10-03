// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  GetGithubAccessToken,
  GetGithubAccessTokenRequestDto,
  GetGithubAccessTokenResponseDto,
} from '../../../domain/github-api/get-access-token';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class ReadGithubAccessTokenController extends BaseController {
  readonly #getGithubAccessToken: GetGithubAccessToken;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    getGithubAccessToken: GetGithubAccessToken,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#getGithubAccessToken = getGithubAccessToken;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): GetGithubAccessTokenRequestDto => ({
    code: httpRequest.body.code,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadGithubAccessTokenController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadGithubAccessTokenController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadGithubAccessTokenController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: GetGithubAccessTokenRequestDto =
        this.#buildRequestDto(req);
      const authDto = undefined;

      const useCaseResult: GetGithubAccessTokenResponseDto =
        await this.#getGithubAccessToken.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return ReadGithubAccessTokenController.badRequest(
          res,
          
        );
      }

      return ReadGithubAccessTokenController.ok(
        res,
        useCaseResult.value,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      
      return ReadGithubAccessTokenController.fail(res, 'Unknown internal error occured');
    }
  }
}
