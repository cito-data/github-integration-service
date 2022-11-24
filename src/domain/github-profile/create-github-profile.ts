import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { GithubProfile } from '../entities/github-profile';
import { IGithubProfileRepo } from './i-github-profile-repo';
import { ReadGithubProfile } from './read-github-profile';

export interface CreateGithubProfileRequestDto {
  installationId: string;
  organizationId: string;
  repositoryNames: string[];
}

export interface CreateGithubProfileAuthDto {
  callerOrgId: string;
  isSystemInternal: boolean;
}

export type CreateGithubProfileResponseDto = Result<GithubProfile>;

export class CreateGithubProfile
  implements
    IUseCase<
      CreateGithubProfileRequestDto,
      CreateGithubProfileResponseDto,
      CreateGithubProfileAuthDto,
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
    request: CreateGithubProfileRequestDto,
    auth: CreateGithubProfileAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateGithubProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const githubProfile = GithubProfile.create({
        id: new ObjectId().toHexString(),
        installationId: request.installationId,
        organizationId: request.organizationId,
        repositoryNames: request.repositoryNames,
      });

      const readGithubProfileResult = await this.#readGithubProfile.execute(
        { installationId: request.installationId },
        {
          callerOrgId: auth.callerOrgId,
          isSystemInternal: auth.isSystemInternal,
        },
        this.#dbConnection
      );

      if (readGithubProfileResult.success && readGithubProfileResult.value)
        throw new Error('Github profile already exists');

      await this.#githubProfileRepo.insertOne(
        githubProfile,
        this.#dbConnection
      );

      return Result.ok(githubProfile);
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
