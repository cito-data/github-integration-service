// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import {
  CreateSlackInteraction,
  CreateSlackInteractionAuthDto,
  CreateSlackInteractionRequestDto,
  CreateSlackInteractionResponseDto,
} from '../../../domain/slack-interaction/create-slack-interaction';
import Dbo from '../../persistence/db/mongo-db';

import { BaseController, CodeHttp } from '../../shared/base-controller';

export default class CreateSlackInteractionController extends BaseController {
  readonly #createSlackInteraction: CreateSlackInteraction;

  readonly #dbo: Dbo;

  constructor(createSlackInteraction: CreateSlackInteraction, dbo: Dbo) {
    super();
    this.#createSlackInteraction = createSlackInteraction;
    this.#dbo = dbo;
  }

  #buildRequestDto = (
    httpRequest: Request
  ): CreateSlackInteractionRequestDto => ({ user: httpRequest.body.user });

  #buildAuthDto = (): CreateSlackInteractionAuthDto => null;

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
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
