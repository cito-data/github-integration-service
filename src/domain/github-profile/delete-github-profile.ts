import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection} from '../services/i-db';
import {
  IGithubProfileRepo
} from './i-github-profile-repo';
import { ReadGithubProfile } from './read-github-profile';

export interface DeleteGithubProfileRequestDto {
  targetOrganizationId: string;
}

export interface DeleteGithubProfileAuthDto {
  isSystemInternal: boolean
}

export type DeleteGithubProfileResponseDto = Result<string>;

export class DeleteGithubProfile
  implements
  IUseCase<
  DeleteGithubProfileRequestDto,
  DeleteGithubProfileResponseDto,
  DeleteGithubProfileAuthDto,
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
    request: DeleteGithubProfileRequestDto,
    auth: DeleteGithubProfileAuthDto,
    dbConnection: DbConnection,
  ): Promise<DeleteGithubProfileResponseDto> {
    try {
      if (!auth.isSystemInternal) throw new Error('Not authorized to perform action');
      this.#dbConnection = dbConnection;

      const readGithubProfileResult =
        await this.#readGithubProfile.execute(
          {
            targetOrganizationId: request.targetOrganizationId,
          },
          { isSystemInternal: auth.isSystemInternal },
          this.#dbConnection,
        );

      if (!readGithubProfileResult.success)
        throw new Error('No such Github profile found');
      if (!readGithubProfileResult.value)
        throw new Error('Github profile retrieval went wrong');

      if (readGithubProfileResult.value.organizationId !== request.targetOrganizationId)
        throw new Error('Not allowed to perform action');

      const deleteResult = await this.#githubProfileRepo.deleteOne(
        readGithubProfileResult.value.id,
        this.#dbConnection
      );

      return Result.ok(deleteResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  };
}
