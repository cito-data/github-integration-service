// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateLineage,
  CreateLineageAuthDto,
  CreateLineageRequestDto,
  CreateLineageResponseDto,
} from '../../../domain/lineage/create-lineage';
import { buildLineageDto } from '../../../domain/lineage/lineage-dto';
import { IDb } from '../../../domain/services/i-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateLineageController extends BaseController {
  readonly #createLineage: CreateLineage;

  readonly #getAccounts: GetAccounts;

  readonly #db: IDb;

  constructor(createLineage: CreateLineage, getAccounts: GetAccounts, db: IDb) {
    super();
    this.#createLineage = createLineage;
    this.#getAccounts = getAccounts;
    this.#db = db;
  }

  #buildRequestDto = (httpRequest: Request): CreateLineageRequestDto => ({
    lineageId: httpRequest.params.lineageCreatedAt,
  });

  #buildAuthDto = (userAccountInfo: UserAccountInfo): CreateLineageAuthDto => ({
    organizationId: userAccountInfo.organizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return CreateLineageController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await CreateLineageInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return CreateLineageInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: CreateLineageRequestDto = this.#buildRequestDto(req);
      // const authDto: CreateLineageAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );

      const client = this.#db.createClient();
      const dbConnection = await this.#db.connect(client);

      const useCaseResult: CreateLineageResponseDto =
        await this.#createLineage.execute(
          requestDto,
          {
            organizationId: 'todo',
          },
          dbConnection
        );

      await this.#db.close(client);

      if (!useCaseResult.success) {
        return CreateLineageController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? buildLineageDto(useCaseResult.value)
        : useCaseResult.value;

      return CreateLineageController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return CreateLineageController.fail(res, error);
      if (error instanceof Error)
        return CreateLineageController.fail(res, error);
      return CreateLineageController.fail(res, 'Unknown error occured');
    }
  }
}
