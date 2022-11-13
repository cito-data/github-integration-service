import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IGithubProfileRepo } from './i-github-profile-repo';
import { GithubProfile } from '../entities/github-profile';
import { DbConnection } from '../services/i-db';

export type ReadGithubProfileRequestDto = {
  installationId?: string;
  targetOrgId?: string;
};

export interface ReadGithubProfileAuthDto {
  callerOrgId?: string;
  isSystemInternal: boolean;
}

export type ReadGithubProfileResponseDto = Result<GithubProfile | undefined>;

export class ReadGithubProfile
  implements
    IUseCase<
      ReadGithubProfileRequestDto,
      ReadGithubProfileResponseDto,
      ReadGithubProfileAuthDto,
      DbConnection
    >
{
  readonly #githubProfileRepo: IGithubProfileRepo;

  #dbConnection: DbConnection;

  constructor(githubProfileRepo: IGithubProfileRepo) {
    this.#githubProfileRepo = githubProfileRepo;
  }

  async execute(
    request: ReadGithubProfileRequestDto,
    auth: ReadGithubProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<ReadGithubProfileResponseDto> {
    try {
      if (
        auth.isSystemInternal &&
        !(request.targetOrgId || request.installationId)
      )
        throw new Error('Target organization id or installation id missing');
      if (!auth.isSystemInternal && !auth.callerOrgId)
        throw new Error('Caller organization id missing');
      if (!request.targetOrgId && !auth.callerOrgId && !request.installationId)
        throw new Error('No potential profile identifier provided');

      let organizationId;
      if (auth.isSystemInternal && request.targetOrgId)
        organizationId = request.targetOrgId;
      else if (auth.callerOrgId)
        organizationId = auth.callerOrgId;
      this.#dbConnection = dbConnection;

      const githubProfile = await this.#githubProfileRepo.findOne(
        this.#dbConnection,
        request.installationId,
        organizationId
      );
      if (!githubProfile) return Result.ok(undefined);

      if (organizationId && githubProfile.organizationId !== organizationId)
        throw new Error('Not authorized to perform action');

      return Result.ok(githubProfile);
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
