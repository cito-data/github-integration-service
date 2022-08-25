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
  firstLineageCreated: boolean;
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
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
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
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #buildUpdateFilter = async (
    updateDto: GithubProfileUpdateDto,
    currentRepositoryNames: string[]
  ): Promise<GithubProfileUpdateFilter> => {
    const setFilter: { [key: string]: unknown } = {};
    const pushFilter: { [key: string]: unknown } = {};

    if (updateDto.firstLineageCreated)
      setFilter.firstLineageCreated = updateDto.firstLineageCreated;
    if (updateDto.repositoriesToAdd)
      setFilter.repositoryNames = currentRepositoryNames.concat(
        updateDto.repositoriesToAdd
      );
    const reposToRemove = updateDto.repositoriesToRemove;
    if (reposToRemove)
      setFilter.repositoryNames = currentRepositoryNames.filter(
        (repoName) => !reposToRemove.includes(repoName)
      );
    if (updateDto.installationId)
      setFilter.installationId = updateDto.installationId;

    return { $set: setFilter, $push: pushFilter };
  };

  updateOne = async (
    id: string,
    currentRepoNames: string[],
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
            currentRepoNames
          )
        );

      if (!result.acknowledged)
        throw new Error('Test suite update failed. Update not acknowledged');

      return result.upsertedId;
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
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
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
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
    firstLineageCreated: githubProfile.firstLineageCreated,
  });

  #toPersistence = async (githubProfile: GithubProfile): Promise<Document> => {
    const persistenceObject: GithubProfilePersistence = {
      _id: ObjectId.createFromHexString(githubProfile.id),
      installationId: githubProfile.installationId,
      organizationId: githubProfile.organizationId,
      repositoryNames: githubProfile.repositoryNames,
      firstLineageCreated: githubProfile.firstLineageCreated,
    };

    return persistenceObject;
  };
}
