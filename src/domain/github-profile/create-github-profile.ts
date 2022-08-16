import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection, DbEncryption } from '../services/i-db';
import { GithubProfile } from '../entities/github-profile';
import { IGithubProfileRepo } from './i-github-profile-repo';
import { ReadGithubProfile } from './read-github-profile';

export interface CreateGithubProfileRequestDto {
  installationId: string,
  organizationId: string,
}

export interface CreateGithubProfileAuthDto {
  callerOrganizationId: string;
}

export type CreateGithubProfileResponseDto = Result<GithubProfile>;

export class CreateGithubProfile
  implements
  IUseCase<
  CreateGithubProfileRequestDto,
  CreateGithubProfileResponseDto,
  CreateGithubProfileAuthDto,
  DbConnection,
  DbEncryption
  >
{
  readonly #githubProfileRepo: IGithubProfileRepo;

  readonly #readGithubProfile: ReadGithubProfile;

  #dbConnection: DbConnection;

  #dbEncryption: DbEncryption;

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
    dbConnection: DbConnection,
    dbEncryption: DbEncryption
  ): Promise<CreateGithubProfileResponseDto> {
    try {
      this.#dbConnection = dbConnection;
      this.#dbEncryption = dbEncryption;

      const githubProfile = GithubProfile.create({
        id: new ObjectId().toHexString(),
        installationId: request.installationId,
        organizationId: request.organizationId,
      });

      const readGithubProfileResult =
        await this.#readGithubProfile.execute(
          { installationId: request.installationId },
          { callerOrganizationId: auth.callerOrganizationId },
          this.#dbConnection,
          this.#dbEncryption
        );

      if (readGithubProfileResult.success)
        throw new Error('Github profile already exists');

      await this.#githubProfileRepo.insertOne(
        githubProfile,
        this.#dbConnection,
        this.#dbEncryption
      );

      return Result.ok(githubProfile);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
