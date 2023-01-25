// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateSlackInteraction,
  CreateSlackInteractionAuthDto,
  CreateSlackInteractionRequestDto,
  CreateSlackInteractionResponseDto,
} from '../../../domain/slack-interaction/create-slack-interaction';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateSlackInteractionController extends BaseController {
  readonly #createSlackInteraction: CreateSlackInteraction;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    createSlackInteraction: CreateSlackInteraction,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#createSlackInteraction = createSlackInteraction;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): CreateSlackInteractionRequestDto => ({ user: httpRequest.body.user });

  #buildAuthDto = (): CreateSlackInteractionAuthDto => null;

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateSlackInteractionController.unauthorized(
          res,
          'Unauthorized'
        );

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await CreateSlackInteractionController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return CreateSlackInteractionController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateSlackInteractionRequestDto =
        this.#buildRequestDto(req);
      const authDto: CreateSlackInteractionAuthDto = this.#buildAuthDto();

      const useCaseResult: CreateSlackInteractionResponseDto =
        await this.#createSlackInteraction.execute(requestDto, authDto);

      if (!useCaseResult.success) {
        return CreateSlackInteractionController.badRequest(res);
      }

      return CreateSlackInteractionController.ok(res, null, CodeHttp.CREATED);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (error) console.trace(error);
      return CreateSlackInteractionController.fail(
        res,
        'Unknown internal error occurred'
      );
    }
  }
}
