export interface IGithubApiRepo {
  getAccessToken(code: string): Promise<string>;
}
