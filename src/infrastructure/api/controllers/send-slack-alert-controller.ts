// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  SendSlackAlert,
  SendSlackAlertAuthDto,
  SendSlackAlertRequestDto,
  SendSlackAlertResponseDto,
} from '../../../domain/slack-api/send-alert';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class SendSlackAlertController extends BaseController {
  readonly #sendSlackAlert: SendSlackAlert;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    sendSlackAlert: SendSlackAlert,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#sendSlackAlert = sendSlackAlert;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): SendSlackAlertRequestDto => ({
    targetOrganizationId: httpRequest.body.targetOrganizationId,
    messageConfig: httpRequest.body.messageConfig,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): SendSlackAlertAuthDto => ({
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return SendSlackAlertController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await SendSlackAlertController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return SendSlackAlertController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        return SendSlackAlertController.unauthorized(res, 'Not authorized');

      const requestDto: SendSlackAlertRequestDto = this.#buildRequestDto(req);
      const authDto: SendSlackAlertAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: SendSlackAlertResponseDto =
        await this.#sendSlackAlert.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection,
        );

      if (!useCaseResult.success) {
        return SendSlackAlertController.badRequest(res, );
      }

      const resultValue = useCaseResult.value;

      return SendSlackAlertController.ok(res, resultValue, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return SendSlackAlertController.fail(res, 'Unknown internal error occured');
    }
  }
}
