// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import {
  Db,
  DeleteResult,
  Document,
  FindCursor,
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
import { decrypt, encrypt, } from './db/mongo-db';

interface SnowflakeProfilePersistence {
  _id: ObjectId;
  accountId: string;
  username: string;
  password: string;
  iv: string;
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

      return this.#toEntity(await this.#buildProperties(result));
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  all = async (dbConnection: Db): Promise<SnowflakeProfile[]> => {
    try {
      const result: FindCursor = await dbConnection
        .collection(collectionName)
        .find();
      const results = await result.toArray();

      if (!results || !results.length) return [];

      const profiles = await Promise.all(
        results.map(async (element: any) =>
          this.#toEntity(await this.#buildProperties(element))
        )
      );

      return profiles;
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
        .insertOne(
          await this.#toPersistence(sanitize(snowflakeProfile), )
        );

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

  #buildUpdateFilter = async (
    updateDto: SnowflakeProfileUpdateDto,
  ): Promise<SnowflakeProfileUpdateFilter> => {
    const setFilter: { [key: string]: unknown } = {};
    const pushFilter: { [key: string]: unknown } = {};

    if (updateDto.accountId) setFilter.accountId = updateDto.accountId;
    if (updateDto.username) setFilter.username = updateDto.username;
    if (updateDto.password) {
      const encryptedPassword = encrypt(updateDto.password);
      setFilter.password = encryptedPassword.content;
      setFilter.iv = encryptedPassword.iv;
    }

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
          await this.#buildUpdateFilter(sanitize(updateDto))
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

  #buildProperties = async (
    snowflakeProfile: SnowflakeProfilePersistence,
  ): Promise<SnowflakeProfileProperties> => {
    const decryptedPassword = await decrypt({
      content: snowflakeProfile.password,
      iv: snowflakeProfile.iv,
    });

    return {
      // eslint-disable-next-line no-underscore-dangle
      id: snowflakeProfile._id.toHexString(),
      organizationId: snowflakeProfile.organizationId,
      accountId: snowflakeProfile.accountId,
      username: snowflakeProfile.username,
      password: decryptedPassword,
    };
  };

  #toPersistence = async (
    snowflakeProfile: SnowflakeProfile,
  ): Promise<Document> => {
    const encryptedPassword = encrypt(snowflakeProfile.password);

    const persistenceObject: SnowflakeProfilePersistence = {
      _id: ObjectId.createFromHexString(snowflakeProfile.id),
      organizationId: snowflakeProfile.organizationId,
      accountId: snowflakeProfile.accountId,
      username: snowflakeProfile.username,
      password: encryptedPassword.content,
      iv: encryptedPassword.iv,
    };

    return persistenceObject;
  };
}
