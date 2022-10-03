// TODO: Violation of control flow. DI for express instead
import { Request, Response } from 'express';
import { GetAccounts } from '../../../domain/account-api/get-accounts';
import {
  CreateSlackProfile,
  CreateSlackProfileAuthDto,
  CreateSlackProfileRequestDto,
  CreateSlackProfileResponseDto,
} from '../../../domain/slack-profile/create-slack-profile';
import { buildSlackProfileDto } from '../../../domain/slack-profile/slack-profile-dto';
import Result from '../../../domain/value-types/transient-types/result';
import Dbo from '../../persistence/db/mongo-db';

import {
  BaseController,
  CodeHttp,
  UserAccountInfo,
} from '../../shared/base-controller';

export default class CreateSlackProfileController extends BaseController {
  readonly #createSlackProfile: CreateSlackProfile;

  readonly #getAccounts: GetAccounts;

  readonly #dbo: Dbo;

  constructor(
    createSlackProfile: CreateSlackProfile,
    getAccounts: GetAccounts,
    dbo: Dbo
  ) {
    super();
    this.#createSlackProfile = createSlackProfile;
    this.#getAccounts = getAccounts;
    this.#dbo = dbo;
  }

  #buildRequestDto = (httpRequest: Request): CreateSlackProfileRequestDto => ({
    channelId: httpRequest.body.channelId,
    channelName: httpRequest.body.channelName,
    accessToken: httpRequest.body.accessToken,
  });

  #buildAuthDto = (
    userAccountInfo: UserAccountInfo
  ): CreateSlackProfileAuthDto => {
    if (!userAccountInfo.callerOrganizationId) throw new Error('Unauthorized');

    return {
      callerOrganizationId: userAccountInfo.callerOrganizationId,
    };
  };

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader)
        return CreateSlackProfileController.unauthorized(res, 'Unauthorized');

      const jwt = authHeader.split(' ')[1];

      const getUserAccountInfoResult: Result<UserAccountInfo> =
        await CreateSlackProfileController.getUserAccountInfo(
          jwt,
          this.#getAccounts
        );

      if (!getUserAccountInfoResult.success)
        return CreateSlackProfileController.unauthorized(
          res,
          getUserAccountInfoResult.error
        );
      if (!getUserAccountInfoResult.value)
        throw new ReferenceError('Authorization failed');

      const requestDto: CreateSlackProfileRequestDto =
        this.#buildRequestDto(req);
      const authDto: CreateSlackProfileAuthDto = this.#buildAuthDto(
        getUserAccountInfoResult.value
      );

      const useCaseResult: CreateSlackProfileResponseDto =
        await this.#createSlackProfile.execute(
          requestDto,
          authDto,
          this.#dbo.dbConnection,
        );

      if (!useCaseResult.success) {
        return CreateSlackProfileController.badRequest(
          res,
          
        );
      }

      const resultValue = useCaseResult.value
        ? buildSlackProfileDto(useCaseResult.value)
        : useCaseResult.value;

      return CreateSlackProfileController.ok(res, resultValue, CodeHttp.CREATED);
    } catch (error: unknown) {
      
      return CreateSlackProfileController.fail(res, 'Unknown internal error occured');
    }
  }
}
