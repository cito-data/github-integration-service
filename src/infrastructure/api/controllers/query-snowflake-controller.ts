// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CrudSnowflakeQuery,
  CrudSnowflakeQueryAuthDto,
  CrudSnowflakeQueryRequestDto,
  CrudSnowflakeQueryResponseDto,
} from '../../../domain/snowflake-query/query-snowflake';
import { buildSnowflakeQueryDto } from '../../../domain/snowflake-query/snowflake-query-dto';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CrudSnowflakeQueryController extends BaseController {
  readonly #crudSnowflakeQuery: CrudSnowflakeQuery;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(crudSnowflakeQuery: CrudSnowflakeQuery, getAccounts: GetAccounts, dbo: Dbo) {
    super();
    this.#crudSnowflakeQuery = crudSnowflakeQuery;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): CrudSnowflakeQueryRequestDto => ({
    query: httpRequest.body.query,
  });

  #buildAuthDto = (userAccountInfo: UserAccountInfo): CrudSnowflakeQueryAuthDto => ({
    organizationId: userAccountInfo.organizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return CrudSnowflakeQueryController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await CrudSnowflakeQueryInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return CrudSnowflakeQueryInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: CrudSnowflakeQueryRequestDto = this.#buildRequestDto(req);
      // const authDto: CrudSnowflakeQueryAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );

      const useCaseResult: CrudSnowflakeQueryResponseDto =
        await this.#crudSnowflakeQuery.execute(
          requestDto,
          {
            organizationId: 'todo',
          },
          this.#dbo.dbConnection
        );


      if (!useCaseResult.success) {
        return CrudSnowflakeQueryController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? buildSnowflakeQueryDto(useCaseResult.value)
        : useCaseResult.value;

      return CrudSnowflakeQueryController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return CrudSnowflakeQueryController.fail(res, error);
      if (error instanceof Error)
        return CrudSnowflakeQueryController.fail(res, error);
      return CrudSnowflakeQueryController.fail(res, 'Unknown error occured');
    }
  }
}
