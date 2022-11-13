import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import {
  GithubProfileUpdateDto,
  IGithubProfileRepo,
} from './i-github-profile-repo';
import { ReadGithubProfile } from './read-github-profile';

export interface RequestUpdateDto {
  repositoryNames?: string[];
  installationId?: string;
}

export interface UpdateGithubProfileRequestDto {
  targetOrgId?: string;
  updateDto: RequestUpdateDto;
}

export interface UpdateGithubProfileAuthDto {
  callerOrgId?: string;
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
      if (auth.isSystemInternal && !request.targetOrgId)
        throw new Error('Target organization id missing');
      if (!auth.isSystemInternal && !auth.callerOrgId)
        throw new Error('Caller organization id missing');
      if (!request.targetOrgId && !auth.callerOrgId)
        throw new Error('No organization Id provided');

      let organizationId;
      if (auth.isSystemInternal && request.targetOrgId)
        organizationId = request.targetOrgId;
      else if (auth.callerOrgId)
        organizationId = auth.callerOrgId;
      else throw new Error('Unhandled organizationId allocation');

      this.#dbConnection = dbConnection;

      const readGithubProfileResult = await this.#readGithubProfile.execute(
        {
          installationId: request.updateDto.installationId,
          targetOrgId: request.targetOrgId,
        },
        {
          isSystemInternal: auth.isSystemInternal,
          callerOrgId: auth.callerOrgId,
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
        this.#buildUpdateDto({
          ...request,
        }),
        this.#dbConnection
      );

      return Result.ok(updateResult);
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }

  #buildUpdateDto = (
    request: UpdateGithubProfileRequestDto
  ): GithubProfileUpdateDto => ({
    installationId: request.updateDto.installationId,
    repositoryNames: request.updateDto.repositoryNames,
  });
}
