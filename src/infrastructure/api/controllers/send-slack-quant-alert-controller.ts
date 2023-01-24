// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  SendSlackQuantAlert,
  SendSlackQuantAlertAuthDto,
  SendSlackQuantAlertRequestDto,
  SendSlackQuantAlertResponseDto,
} from '../../../domain/slack-api/send-quant-alert';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class SendSlackQuantAlertController extends BaseController {
  readonly #sendSlackQuantAlert: SendSlackQuantAlert;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    sendSlackQuantAlert: SendSlackQuantAlert,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#sendSlackQuantAlert = sendSlackQuantAlert;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): SendSlackQuantAlertRequestDto => ({
    targetOrgId: httpRequest.body.targetOrgId,
    messageConfig: httpRequest.body.messageConfig,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): SendSlackQuantAlertAuthDto => ({
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return SendSlackQuantAlertController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await SendSlackQuantAlertController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return SendSlackQuantAlertController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        return SendSlackQuantAlertController.unauthorized(
          res,
          'Not authorized'
        );

      const requestDto: SendSlackQuantAlertRequestDto =
        this.#buildRequestDto(req);
      const authDto: SendSlackQuantAlertAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: SendSlackQuantAlertResponseDto =
        await this.#sendSlackQuantAlert.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return SendSlackQuantAlertController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      return SendSlackQuantAlertController.ok(
        res,
        resultValue,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return SendSlackQuantAlertController.fail(
        res,
        'Unknown internal error occurred'
      );
    }
  }
}
