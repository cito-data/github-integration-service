// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CrudSnowflakeResource,
  CrudSnowflakeResourceAuthDto,
  CrudSnowflakeResourceRequestDto,
  CrudSnowflakeResourceResponseDto,
} from '../../../domain/snowflake-resource/crud-snowflake-resource';
import { buildSnowflakeResourceDto } from '../../../domain/snowflake-resource/snowflake-resource-dto';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CrudSnowflakeResourceController extends BaseController {
  readonly #crudSnowflakeResource: CrudSnowflakeResource;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(crudSnowflakeResource: CrudSnowflakeResource, getAccounts: GetAccounts, dbo: Dbo) {
    super();
    this.#crudSnowflakeResource = crudSnowflakeResource;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): CrudSnowflakeResourceRequestDto => ({
    query: httpRequest.body.query,
  });

  #buildAuthDto = (userAccountInfo: UserAccountInfo): CrudSnowflakeResourceAuthDto => ({
    organizationId: userAccountInfo.organizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return CrudSnowflakeResourceController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await CrudSnowflakeResourceInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return CrudSnowflakeResourceInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: CrudSnowflakeResourceRequestDto = this.#buildRequestDto(req);
      // const authDto: CrudSnowflakeResourceAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );

      const useCaseResult: CrudSnowflakeResourceResponseDto =
        await this.#crudSnowflakeResource.execute(
          requestDto,
          {
            organizationId: 'todo',
          },
          this.#dbo.dbConnection
        );


      if (!useCaseResult.success) {
        return CrudSnowflakeResourceController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? buildSnowflakeResourceDto(useCaseResult.value)
        : useCaseResult.value;

      return CrudSnowflakeResourceController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return CrudSnowflakeResourceController.fail(res, error);
      if (error instanceof Error)
        return CrudSnowflakeResourceController.fail(res, error);
      return CrudSnowflakeResourceController.fail(res, 'Unknown error occured');
    }
  }
}
