// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  SendSlackQualAlert,
  SendSlackQualAlertAuthDto,
  SendSlackQualAlertRequestDto,
  SendSlackQualAlertResponseDto,
} from '../../../domain/slack-api/send-qual-alert';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class SendSlackQualAlertController extends BaseController {
  readonly #sendSlackQualAlert: SendSlackQualAlert;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    sendSlackQualAlert: SendSlackQualAlert,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#sendSlackQualAlert = sendSlackQualAlert;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): SendSlackQualAlertRequestDto => ({
    targetOrgId: httpRequest.body.targetOrgId,
    messageConfig: httpRequest.body.messageConfig,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): SendSlackQualAlertAuthDto => ({
    isSystemInternal: userAccountInfo.isSystemInternal,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return SendSlackQualAlertController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await SendSlackQualAlertController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return SendSlackQualAlertController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      if (!getUserAccountInfoResult.value.isSystemInternal)
        return SendSlackQualAlertController.unauthorized(res, 'Not authorized');

      const requestDto: SendSlackQualAlertRequestDto =
        this.#buildRequestDto(req);
      const authDto: SendSlackQualAlertAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: SendSlackQualAlertResponseDto =
        await this.#sendSlackQualAlert.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection
        );

      if (!useCaseResult.success) {
        return SendSlackQualAlertController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      return SendSlackQualAlertController.ok(
        res,
        resultValue,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return SendSlackQualAlertController.fail(
        res,
        'Unknown internal error occurred'
      );
    }
  }
}
