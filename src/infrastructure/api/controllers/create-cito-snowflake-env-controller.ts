// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateCitoSnowflakeEnv,
  CreateCitoSnowflakeEnvAuthDto,
  CreateCitoSnowflakeEnvRequestDto,
  CreateCitoSnowflakeEnvResponseDto,
} from '../../../domain/cito-snowflake-env/create-cito-snowflake-env';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateCitoSnowflakeEnvController extends BaseController {
  readonly #createCitoSnowflakeEnv: CreateCitoSnowflakeEnv;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    createCitoSnowflakeEnv: CreateCitoSnowflakeEnv,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#createCitoSnowflakeEnv = createCitoSnowflakeEnv;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (): CreateCitoSnowflakeEnvRequestDto => null;

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): CreateCitoSnowflakeEnvAuthDto => {
    if (!userAccountInfo.callerOrgId) throw new Error('Unauthorized');

    return {
      callerOrgId: userAccountInfo.callerOrgId,
      isSystemInternal: userAccountInfo.isSystemInternal,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateCitoSnowflakeEnvController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await CreateCitoSnowflakeEnvController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return CreateCitoSnowflakeEnvController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateCitoSnowflakeEnvRequestDto =
        this.#buildRequestDto();
      const authDto: CreateCitoSnowflakeEnvAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: CreateCitoSnowflakeEnvResponseDto =
        await this.#createCitoSnowflakeEnv.execute(
          requestDto,
          authDto,
          this.#dbo
        );

      if (!useCaseResult.success) {
        return CreateCitoSnowflakeEnvController.badRequest(res);
      }

      const resultValue = useCaseResult.value;

      return CreateCitoSnowflakeEnvController.ok(
        res,
        resultValue,
        CodeHttp.CREATED
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return CreateCitoSnowflakeEnvController.fail(
        res,
        'Unknown internal error occurred'
      );
    }
  }
}
