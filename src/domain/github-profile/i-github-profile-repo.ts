import { GithubProfile } from '../entities/github-profile';
import { DbConnection,  } from '../services/i-db';

export interface GithubProfileUpdateDto {
  firstLineageCreated?: boolean;
  repositoriesToAdd?: string[],
  repositoriesToRemove?: string[]
}
export interface IGithubProfileRepo {
  findOne(
    installationId:string,
    dbConnection: DbConnection,
  ): Promise<GithubProfile | null>;
  
  insertOne(
    githubProfile: GithubProfile,
    dbConnection: DbConnection,
  ): Promise<string>;

  updateOne(
    id: string,
    updateDto: GithubProfileUpdateDto,
    dbConnection: DbConnection,
  ): Promise<string>;
  
  deleteOne(
    id: string,
    dbConnection: DbConnection
  ): Promise<string>;
  
}
