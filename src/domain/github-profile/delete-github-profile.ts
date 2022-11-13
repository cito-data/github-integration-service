import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection} from '../services/i-db';
import {
  IGithubProfileRepo
} from './i-github-profile-repo';
import { ReadGithubProfile } from './read-github-profile';

export interface DeleteGithubProfileRequestDto {
  targetOrgId: string;
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
            targetOrgId: request.targetOrgId,
          },
          { isSystemInternal: auth.isSystemInternal },
          this.#dbConnection,
        );

      if (!readGithubProfileResult.success)
        throw new Error('No such Github profile found');
      if (!readGithubProfileResult.value)
        throw new Error('Github profile retrieval went wrong');

      if (readGithubProfileResult.value.organizationId !== request.targetOrgId)
        throw new Error('Not allowed to perform action');

      const deleteResult = await this.#githubProfileRepo.deleteOne(
        readGithubProfileResult.value.id,
        this.#dbConnection
      );

      return Result.ok(deleteResult);
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  };
}
