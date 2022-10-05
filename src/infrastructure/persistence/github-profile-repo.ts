// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import {
  Db,
  DeleteResult,
  Document,
  InsertOneResult,
  ObjectId,
  UpdateResult,
} from 'mongodb';
import sanitize from 'mongo-sanitize';

import {
  GithubProfileUpdateDto,
  IGithubProfileRepo,
} from '../../domain/github-profile/i-github-profile-repo';
import {
  GithubProfile,
  GithubProfileProperties,
} from '../../domain/entities/github-profile';

interface GithubProfilePersistence {
  _id: ObjectId;
  installationId: string;
  organizationId: string;
  repositoryNames: string[];
}

interface GithubProfileUpdateFilter {
  $set: { [key: string]: unknown };
  $push: { [key: string]: unknown };
}

const collectionName = 'githubProfile';

export default class GithubProfileRepo implements IGithubProfileRepo {
  findOne = async (
    dbConnection: Db,
    installationId?: string,
    organizationId?: string
  ): Promise<GithubProfile | null> => {
    if (!installationId && !organizationId)
      throw new Error(
        'Either the installationId or organizationId need to be provided to find Github profile'
      );

    try {
      const result: any = await dbConnection
        .collection(collectionName)
        .findOne(
          organizationId
            ? { organizationId: sanitize(organizationId) }
            : { installationId: sanitize(installationId) }
        );

      if (!result) return null;

      return this.#toEntity(await this.#buildProperties(result));
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message); 
    else if (!(error instanceof Error) && error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  insertOne = async (
    githubProfile: GithubProfile,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(githubProfile)));

      if (!result.acknowledged)
        throw new Error(
          'GithubProfile creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message); 
    else if (!(error instanceof Error) && error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  #buildUpdateFilter = async (
    updateDto: GithubProfileUpdateDto,
  ): Promise<GithubProfileUpdateFilter> => {
    const setFilter: { [key: string]: unknown } = {};
    const pushFilter: { [key: string]: unknown } = {};

    if (updateDto.repositoryNames)
      setFilter.repositoryNames = updateDto.repositoryNames;
    if (updateDto.installationId)
      setFilter.installationId = updateDto.installationId;

    return { $set: setFilter, $push: pushFilter };
  };

  updateOne = async (
    id: string,
    updateDto: GithubProfileUpdateDto,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: Document | UpdateResult = await dbConnection
        .collection(collectionName)
        .updateOne(
          { _id: new ObjectId(sanitize(id)) },
          await this.#buildUpdateFilter(
            sanitize(updateDto),
          )
        );

      if (!result.acknowledged)
        throw new Error('Test suite update failed. Update not acknowledged');

      return result.upsertedId;
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message); 
    else if (!(error instanceof Error) && error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  deleteOne = async (id: string, dbConnection: Db): Promise<string> => {
    try {
      const result: DeleteResult = await dbConnection
        .collection(collectionName)
        .deleteOne({ _id: new ObjectId(sanitize(id)) });

      if (!result.acknowledged)
        throw new Error(
          'SnowflakeProfile delete failed. Delete not acknowledged'
        );

      return result.deletedCount.toString();
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message); 
    else if (!(error instanceof Error) && error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  #toEntity = (properties: GithubProfileProperties): GithubProfile =>
    GithubProfile.create(properties);

  #buildProperties = async (
    githubProfile: GithubProfilePersistence
  ): Promise<GithubProfileProperties> => ({
    // eslint-disable-next-line no-underscore-dangle
    id: githubProfile._id.toHexString(),
    installationId: githubProfile.installationId,
    organizationId: githubProfile.organizationId,
    repositoryNames: githubProfile.repositoryNames,
  });

  #toPersistence = async (githubProfile: GithubProfile): Promise<Document> => {
    const persistenceObject: GithubProfilePersistence = {
      _id: ObjectId.createFromHexString(githubProfile.id),
      installationId: githubProfile.installationId,
      organizationId: githubProfile.organizationId,
      repositoryNames: githubProfile.repositoryNames,
    };

    return persistenceObject;
  };
}
