// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import { buildDependencyDto } from '../../../domain/dependency/dependency-dto';
import {
  ReadDependencies,
  ReadDependenciesAuthDto,
  ReadDependenciesRequestDto,
  ReadDependenciesResponseDto,
} from '../../../domain/dependency/read-dependencies';
import { DependencyType } from '../../../domain/entities/dependency';
import { IDb } from '../../../domain/services/i-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class ReadDependenciesController extends BaseController {
  readonly #readDependencies: ReadDependencies;

  readonly #getAccounts: GetAccounts;

  readonly #db: IDb;

  constructor(
    readDependencies: ReadDependencies,
    getAccounts: GetAccounts,
    db: IDb
  ) {
    super();
    this.#readDependencies = readDependencies;
    this.#getAccounts = getAccounts;
    this.#db = db;
  }

  #buildRequestDto = (httpRequest: Request): ReadDependenciesRequestDto => {
    const { type, headId, tailId, lineageId } = httpRequest.query;

    const isDependencyType = (
      queryParam: string
    ): queryParam is DependencyType => queryParam in DependencyType;

    if (type) {
      if (typeof type !== 'string')
        throw new TypeError(
          'When querying dependencies the lineageId query param must be of type string'
        );

      if (!isDependencyType(type))
        throw new TypeError(
          'When querying dependencies the type needs to be of type DependencyType'
        );
    }

    if (!lineageId)
      throw new TypeError(
        'When querying dependencies the lineageId must be provided'
      );
    if (typeof lineageId !== 'string')
      throw new TypeError(
        'When querying dependencies the lineageId query param must be of type string'
      );

    return {
      type: type && isDependencyType(type) ? type : undefined,
      headId: typeof headId === 'string' ? headId : undefined,
      tailId: typeof tailId === 'string' ? tailId : undefined,

      lineageId,
    };
  };

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): ReadDependenciesAuthDto => ({
    organizationId: userAccountInfo.organizationId,
  });

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      // const authHeader = req.headers.authorization;

      // if (!authHeader)
      //   return ReadDependenciesController.unauthorized(res, 'Unauthorized');

      // const jwt = authHeader.split(' ')[1];

      // const getUserAccountInfoResult: Result<UserAccountInfo> =
      //   await ReadDependenciesInfoController.getUserAccountInfo(
      //     jwt,
      //     this.#getAccounts
      //   );

      // if (!getUserAccountInfoResult.success)
      //   return ReadDependenciesInfoController.unauthorized(
      //     res,
      //     getUserAccountInfoResult.error
      //   );
      // if (!getUserAccountInfoResult.value)
      //   throw new ReferenceError('Authorization failed');

      const requestDto: ReadDependenciesRequestDto = this.#buildRequestDto(req);
      // const authDto: ReadDependenciesAuthDto = this.#buildAuthDto(
      //   getUserAccountResult.value
      // );
      const client = this.#db.createClient();
      const dbConnection = await this.#db.connect(client);

      const useCaseResult: ReadDependenciesResponseDto =
        await this.#readDependencies.execute(
          requestDto,
          {
            organizationId: 'todo',
          },
          dbConnection
        );

      await this.#db.close(client);

      if (!useCaseResult.success) {
        return ReadDependenciesController.badRequest(res, useCaseResult.error);
      }

      const resultValue = useCaseResult.value
        ? useCaseResult.value.map((element) => buildDependencyDto(element))
        : useCaseResult.value;

      return ReadDependenciesController.ok(res, resultValue, CodeHttp.OK);
    } catch (error: unknown) {
      if (typeof error === 'string')
        return ReadDependenciesController.fail(res, error);
      if (error instanceof Error)
        return ReadDependenciesController.fail(res, error);
      return ReadDependenciesController.fail(res, 'Unknown error occured');
    }
  }
}
