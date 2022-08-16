import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IGithubProfileRepo } from './i-github-profile-repo';
import { GithubProfile } from '../entities/github-profile';
import { DbConnection, DbEncryption } from '../services/i-db';

export type ReadGithubProfileRequestDto = {
  installationId: string;
}

export interface ReadGithubProfileAuthDto {
  callerOrganizationId: string;
}

export type ReadGithubProfileResponseDto = Result<GithubProfile>;

export class ReadGithubProfile
  implements
    IUseCase<
      ReadGithubProfileRequestDto,
      ReadGithubProfileResponseDto,
      ReadGithubProfileAuthDto,
      DbConnection,
      DbEncryption
    >
{
  readonly #githubProfileRepo: IGithubProfileRepo;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

  constructor(githubProfileRepo: IGithubProfileRepo) {
    this.#githubProfileRepo = githubProfileRepo;
  }

  async execute(
    request: ReadGithubProfileRequestDto,
    auth: ReadGithubProfileAuthDto,
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<ReadGithubProfileResponseDto> {
    try {
      // todo -replace
      console.log(auth);

      this.#dbConnection = dbConnection;

      this.#dbEncryption = dbEncryption;

      const githubProfile = await this.#githubProfileRepo.findOne(
        request.installationId,
        this.#dbConnection,
        this.#dbEncryption
      );
      if (!githubProfile)
        throw new Error(`SlackProfile with id ${auth.callerOrganizationId} does not exist`);

      if (githubProfile.organizationId !== auth.callerOrganizationId)
        throw new Error('Not authorized to perform action');

      return Result.ok(githubProfile);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
