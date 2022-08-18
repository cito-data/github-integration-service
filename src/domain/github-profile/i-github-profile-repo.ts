import { GithubProfile } from '../entities/github-profile';
import { DbConnection, DbEncryption } from '../services/i-db';

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
    dbConnection: DbConnection,
    encryption?: DbEncryption
  ): Promise<string>;
  
}
