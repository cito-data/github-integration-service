// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  QuerySnowflake,
  QuerySnowflakeAuthDto,
  QuerySnowflakeRequestDto,
  QuerySnowflakeResponseDto,
} from '../../../domain/snowflake-query/query-snowflake';
import { buildSnowflakeQueryDto } from '../../../domain/snowflake-query/snowflake-query-dto';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class QuerySnowflakeController extends BaseController {
  readonly #querySnowflake: QuerySnowflake;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(querySnowflake: QuerySnowflake, getAccounts: GetAccounts, dbo: Dbo) {
    super();
    this.#querySnowflake = querySnowflake;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): QuerySnowflakeRequestDto => ({
    query: httpRequest.body.query,
  });

  #buildAuthDto = (userAccountInfo: UserAccountInfo): QuerySnowflakeAuthDto => ({
    organizationId: userAccountInfo.organizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return SnowflakeQueryController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await SnowflakeQueryInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return SnowflakeQueryInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: QuerySnowflakeRequestDto = this.#buildRequestDto(req);
      // const authDto: SnowflakeQueryAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );

      const useCaseResult: QuerySnowflakeResponseDto =
        await this.#querySnowflake.execute(
          requestDto,
          {
            organizationId: 'todo',
          },
          this.#dbo.dbConnection
        );


      if (!useCaseResult.success) {
        return QuerySnowflakeController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? buildSnowflakeQueryDto(useCaseResult.value)
        : useCaseResult.value;

      return QuerySnowflakeController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return QuerySnowflakeController.fail(res, error);
      if (error instanceof Error)
        return QuerySnowflakeController.fail(res, error);
      return QuerySnowflakeController.fail(res, 'Unknown error occured');
    }
  }
}
