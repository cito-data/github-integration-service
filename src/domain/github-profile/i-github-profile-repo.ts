import { GithubProfile } from '../entities/github-profile';
import { DbConnection, DbEncryption } from '../services/i-db';

export interface GithubProfileUpdateDto {
  firstLineageCreated?: boolean;
  repositoriesToAdd?: string[],
  repositoriesToRemove?: string[]
}
export interface IGithubProfileRepo {
  findOne(
    installationId:string,
    dbConnection: DbConnection,
    encryption: DbEncryption
  ): Promise<GithubProfile | null>;
  
  insertOne(
    githubProfile: GithubProfile,
    dbConnection: DbConnection,
    encryption: DbEncryption
  ): Promise<string>;

  updateOne(
    id: string,
    updateDto: GithubProfileUpdateDto,
    dbConnection: DbConnection,
    encryption?: DbEncryption
  ): Promise<string>;
  
  deleteOne(
    id: string,
    dbConnection: DbConnection
  ): Promise<string>;
  
}
