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
  ISnowflakeProfileRepo,
  SnowflakeProfileUpdateDto,
} from '../../domain/snowflake-profile/i-snowflake-profile-repo';
import {
  SnowflakeProfile,
  SnowflakeProfileProperties,
} from '../../domain/entities/snowflake-profile';

interface SnowflakeProfilePersistence {
  _id: ObjectId;
  accountId: string;
  username: string;
  password: string;
  organizationId: string;
}

interface SnowflakeProfileUpdateFilter {
  $set: { [key: string]: unknown };
  $push: { [key: string]: unknown };
}

const collectionName = 'snowflakeProfile';

export default class SnowflakeProfileRepo implements ISnowflakeProfileRepo {
  findOne = async (
    organizationId: string,
    dbConnection: Db
  ): Promise<SnowflakeProfile | null> => {
    try {
      const result: any = await dbConnection
        .collection(collectionName)
        .findOne({ organizationId: sanitize(organizationId) });

      if (!result) return null;

      return this.#toEntity(this.#buildProperties(result));
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  insertOne = async (
    snowflakeProfile: SnowflakeProfile,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(this.#toPersistence(sanitize(snowflakeProfile)));

      if (!result.acknowledged)
        throw new Error(
          'SnowflakeProfile creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #buildUpdateFilter = (
    updateDto: SnowflakeProfileUpdateDto
  ): SnowflakeProfileUpdateFilter => {
    const setFilter: { [key: string]: unknown } = {};
    const pushFilter: { [key: string]: unknown } = {};

    if (updateDto.accountId) setFilter.accountId = updateDto.accountId;
    if (updateDto.username) setFilter.username = updateDto.username;
    if (updateDto.password) setFilter.password = updateDto.password;

    return { $set: setFilter, $push: pushFilter };
  };

  updateOne = async (
    id: string,
    updateDto: SnowflakeProfileUpdateDto,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: Document | UpdateResult = await dbConnection
        .collection(collectionName)
        .updateOne(
          { _id: new ObjectId(sanitize(id)) },
          this.#buildUpdateFilter(sanitize(updateDto))
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

  #toEntity = (props: SnowflakeProfileProperties): SnowflakeProfile =>
    SnowflakeProfile.create(props);

  #buildProperties = (
    snowflakeProfile: SnowflakeProfilePersistence
  ): SnowflakeProfileProperties => ({
      // eslint-disable-next-line no-underscore-dangle
      id: snowflakeProfile._id.toHexString(),
      organizationId: snowflakeProfile.organizationId,
      accountId: snowflakeProfile.accountId,
      username: snowflakeProfile.username,
      password: snowflakeProfile.password
    });

  #toPersistence = (snowflakeProfile: SnowflakeProfile): Document => {
    const persistenceObject: SnowflakeProfilePersistence = {
      _id: ObjectId.createFromHexString(snowflakeProfile.id),
      organizationId: snowflakeProfile.organizationId,
      accountId: snowflakeProfile.accountId,
      username: snowflakeProfile.username,
      password: snowflakeProfile.password
    };

    return persistenceObject;
  };
}
