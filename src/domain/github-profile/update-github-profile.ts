import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import {
  GithubProfileUpdateDto,
  IGithubProfileRepo,
} from './i-github-profile-repo';
import { ReadGithubProfile } from './read-github-profile';

export interface RequestUpdateDto {
  firstLineageCreated?: boolean;
  repositoriesToAdd?: string[];
  repositoriesToRemove?: string[];
  installationId?: string;
}

export interface UpdateGithubProfileRequestDto {
  targetOrganizationId?: string;
  updateDto: RequestUpdateDto;
}

export interface UpdateGithubProfileAuthDto {
  callerOrganizationId?: string;
  isSystemInternal: boolean;
}

export type UpdateGithubProfileResponseDto = Result<string>;

export class UpdateGithubProfile
  implements
    IUseCase<
      UpdateGithubProfileRequestDto,
      UpdateGithubProfileResponseDto,
      UpdateGithubProfileAuthDto,
      DbConnection
    >
{
  readonly #githubProfileRepo: IGithubProfileRepo;

  readonly #readGithubProfile: ReadGithubProfile;

  #dbConnection: DbConnection;

  constructor(
    readGithubProfile: ReadGithubProfile,
    githubProfileRepo: IGithubProfileRepo
  ) {
    this.#readGithubProfile = readGithubProfile;
    this.#githubProfileRepo = githubProfileRepo;
  }

  async execute(
    request: UpdateGithubProfileRequestDto,
    auth: UpdateGithubProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<UpdateGithubProfileResponseDto> {
    try {
      if (auth.isSystemInternal && !request.targetOrganizationId)
        throw new Error('Target organization id missing');
      if (!auth.isSystemInternal && !auth.callerOrganizationId)
        throw new Error('Caller organization id missing');
      if (!request.targetOrganizationId && !auth.callerOrganizationId)
        throw new Error('No organization Id provided');

      let organizationId;
      if (auth.isSystemInternal && request.targetOrganizationId)
        organizationId = request.targetOrganizationId;
      else if (auth.callerOrganizationId)
        organizationId = auth.callerOrganizationId;
      else throw new Error('Unhandled organizationId allocation');

      this.#dbConnection = dbConnection;

      const readGithubProfileResult = await this.#readGithubProfile.execute(
        {
          installationId: request.updateDto.installationId,
          targetOrganizationId: request.targetOrganizationId,
        },
        {
          isSystemInternal: auth.isSystemInternal,
          callerOrganizationId: auth.callerOrganizationId,
        },
        this.#dbConnection
      );

      if (!readGithubProfileResult.success)
        throw new Error('No such Github profile found');
      if (!readGithubProfileResult.value)
        throw new Error('Github profile retrieval went wrong');

      if (readGithubProfileResult.value.organizationId !== organizationId)
        throw new Error('Not allowed to perform action');

      const updateResult = await this.#githubProfileRepo.updateOne(
        readGithubProfileResult.value.id,
        readGithubProfileResult.value.repositoryNames,
        this.#buildUpdateDto({
          ...request,
        }),
        this.#dbConnection
      );

      return Result.ok(updateResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }

  #buildUpdateDto = (
    request: UpdateGithubProfileRequestDto
  ): GithubProfileUpdateDto => ({
    firstLineageCreated: request.updateDto.firstLineageCreated,
    installationId: request.updateDto.installationId,
    repositoriesToAdd: request.updateDto.repositoriesToAdd,
    repositoriesToRemove: request.updateDto.repositoriesToRemove,
  });
}
