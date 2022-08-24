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
  callerOrganizationId: string;
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
        firstLineageCreated: false,
      });

      const readGithubProfileResult = await this.#readGithubProfile.execute(
        { installationId: request.installationId },
        {
          callerOrganizationId: auth.callerOrganizationId,
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
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
