// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  GetSlackConversations,
  GetSlackConversationsAuthDto,
  GetSlackConversationsRequestDto,
  GetSlackConversationsResponseDto,
} from '../../../domain/slack-api/get-conversations';
import { buildConversationInfoDto } from '../../../domain/slack-api/slack-conversation-info-dto';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class ReadSlackConversationsController extends BaseController {
  readonly #getslackconversations: GetSlackConversations;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    getslackconversations: GetSlackConversations,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#getslackconversations = getslackconversations;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): GetSlackConversationsRequestDto => ({
    accessToken:
      typeof httpRequest.query.accessToken === 'string'
        ? httpRequest.query.accessToken
        : undefined,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): GetSlackConversationsAuthDto => {
    if (!userAccountInfo.callerOrgId) throw new Error('Unauthorized');

    return {
      callerOrgId: userAccountInfo.callerOrgId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return ReadSlackConversationsController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await ReadSlackConversationsController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return ReadSlackConversationsController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: GetSlackConversationsRequestDto = this.#buildRequestDto(req);
      const authDto: GetSlackConversationsAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: GetSlackConversationsResponseDto =
        await this.#getslackconversations.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return ReadSlackConversationsController.badRequest(
          res,
          
        );
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.map((element) =>
            buildConversationInfoDto(element)
          )
        : useCaseResult.value;

      return ReadSlackConversationsController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return ReadSlackConversationsController.fail(
        res,
        'Unknown internal error occured'
      );
    }
  }
}
