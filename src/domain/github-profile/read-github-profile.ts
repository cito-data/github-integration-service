import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IGithubProfileRepo } from './i-github-profile-repo';
import { GithubProfile } from '../entities/github-profile';
import { DbConnection } from '../services/i-db';

export type ReadGithubProfileRequestDto = {
  installationId: string;
  targetOrganizationId?: string;
};

export interface ReadGithubProfileAuthDto {
  callerOrganizationId?: string;
  isSystemInternal: boolean;
}

export type ReadGithubProfileResponseDto = Result<GithubProfile|undefined>;

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
      // todo -replace
      console.log(auth);
      if (auth.isSystemInternal && !request.targetOrganizationId)
        throw new Error('Target organization id missing');
      if (!auth.isSystemInternal && !auth.callerOrganizationId)
        throw new Error('Caller organization id missing');
      if (!request.targetOrganizationId && !auth.callerOrganizationId)
        throw new Error('No organization Id instance provided');

      let organizationId;
      if (auth.isSystemInternal && request.targetOrganizationId)
        organizationId = request.targetOrganizationId;
      else if (auth.callerOrganizationId)
        organizationId = auth.callerOrganizationId;
      else throw new Error('Unhandled organizationId allocation');

      this.#dbConnection = dbConnection;

      const githubProfile = await this.#githubProfileRepo.findOne(
        request.installationId,
        this.#dbConnection
      );
      if (!githubProfile)
        return Result.ok(undefined);

      if (githubProfile.organizationId !== organizationId)
        throw new Error('Not authorized to perform action');

      return Result.ok(githubProfile);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
