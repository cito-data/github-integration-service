import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { IGithubApiRepo } from './i-github-api-repo';

export type GetGithubAccessTokenRequestDto = {
  code: string;
};

export type GetGithubAccessTokenAuthDto = undefined 

export type GetGithubAccessTokenResponseDto = Result<string>;

export class GetGithubAccessToken
  implements
    IUseCase<
      GetGithubAccessTokenRequestDto,
      GetGithubAccessTokenResponseDto,
      GetGithubAccessTokenAuthDto,
      DbConnection
    >
{
  readonly #githubApiRepo: IGithubApiRepo;

  #dbConnection: DbConnection;

  constructor(githubApiRepo: IGithubApiRepo) {
    this.#githubApiRepo = githubApiRepo;
  }

  async execute(
    request: GetGithubAccessTokenRequestDto,
    auth: GetGithubAccessTokenAuthDto,
    dbConnection: DbConnection
  ): Promise<GetGithubAccessTokenResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const accesstoken = await this.#githubApiRepo.getAccessToken(
        request.code
      );

      // if (githubQuery.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(accesstoken);
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
