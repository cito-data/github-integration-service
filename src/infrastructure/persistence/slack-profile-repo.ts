// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import {
  Binary,
  Db,
  DeleteResult,
  Document,
  FindCursor,
  InsertOneResult,
  ObjectId,
  UpdateResult,
} from 'mongodb';
import sanitize from 'mongo-sanitize';

import { ClientEncryption } from 'mongodb-client-encryption';
import {
  ISlackProfileRepo,
  SlackProfileUpdateDto,
} from '../../domain/slack-profile/i-slack-profile-repo';
import {
  SlackProfile,
  SlackProfileProperties,
} from '../../domain/entities/slack-profile';
import { appConfig } from '../../config';

interface SlackProfilePersistence {
  _id: ObjectId;
  channelId: string;
  workspaceId: string;
  accessToken: Binary;
  organizationId: string;
}

interface SlackProfileUpdateFilter {
  $set: { [key: string]: unknown };
  $push: { [key: string]: unknown };
}

const collectionName = 'slackProfile';

export default class SlackProfileRepo implements ISlackProfileRepo {
  findOne = async (
    organizationId: string,
    dbConnection: Db,
    encryption: ClientEncryption
  ): Promise<SlackProfile | null> => {
    try {
      const result: any = await dbConnection
        .collection(collectionName)
        .findOne({ organizationId: sanitize(organizationId) });

      if (!result) return null;

      return this.#toEntity(await this.#buildProperties(result, encryption));
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  all = async (
    dbConnection: Db,
    encryption: ClientEncryption
  ): Promise<SlackProfile[]> => {
    try {
      const result: FindCursor = await dbConnection
        .collection(collectionName)
        .find();
      const results = await result.toArray();

      if (!results || !results.length) return [];

      const profiles = await Promise.all(
        results.map(async (element: any) =>
          this.#toEntity(await this.#buildProperties(element, encryption))
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
    slackProfile: SlackProfile,
    dbConnection: Db,
    encryption: ClientEncryption
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(
          await this.#toPersistence(sanitize(slackProfile), encryption)
        );

      if (!result.acknowledged)
        throw new Error(
          'SlackProfile creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #buildUpdateFilter = async (
    updateDto: SlackProfileUpdateDto,
    encryption?: ClientEncryption
  ): Promise<SlackProfileUpdateFilter> => {
    const setFilter: { [key: string]: unknown } = {};
    const pushFilter: { [key: string]: unknown } = {};

    if (updateDto.workspaceId) setFilter.workspaceId = updateDto.workspaceId;
    if (updateDto.channelId) setFilter.username = updateDto.channelId;
    if (updateDto.accessToken) {
      if (!encryption) throw new Error('Encryption object missing');
      const encryptedToken = await encryption.encrypt(updateDto.accessToken, {
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        keyId: new Binary(appConfig.mongodb.dataKeyId, 4),
      });
      setFilter.accessToken = encryptedToken;
    }

    return { $set: setFilter, $push: pushFilter };
  };

  updateOne = async (
    id: string,
    updateDto: SlackProfileUpdateDto,
    dbConnection: Db,
    encryption?: ClientEncryption
  ): Promise<string> => {
    try {
      const result: Document | UpdateResult = await dbConnection
        .collection(collectionName)
        .updateOne(
          { _id: new ObjectId(sanitize(id)) },
          await this.#buildUpdateFilter(sanitize(updateDto), encryption)
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
        throw new Error('SlackProfile delete failed. Delete not acknowledged');

      return result.deletedCount.toString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #toEntity = (props: SlackProfileProperties): SlackProfile =>
    SlackProfile.create(props);

  #buildProperties = async (
    slackProfile: SlackProfilePersistence,
    encryption: ClientEncryption
  ): Promise<SlackProfileProperties> => {
    const decryptedToken = await encryption.decrypt(slackProfile.accessToken);

    return {
      // eslint-disable-next-line no-underscore-dangle
      id: slackProfile._id.toHexString(),
      organizationId: slackProfile.organizationId,
      workspaceId: slackProfile.workspaceId,
      channelId: slackProfile.channelId,
      accessToken: decryptedToken,
    };
  };

  #toPersistence = async (
    slackProfile: SlackProfile,
    encryption: ClientEncryption
  ): Promise<Document> => {
    const encryptedToken = await encryption.encrypt(slackProfile.accessToken, {
      algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
      keyId: new Binary(appConfig.mongodb.dataKeyId, 4),
    });

    const persistenceObject: SlackProfilePersistence = {
      _id: ObjectId.createFromHexString(slackProfile.id),
      organizationId: slackProfile.organizationId,
      workspaceId: slackProfile.workspaceId,
      channelId: slackProfile.channelId,
      accessToken: encryptedToken,
    };

    return persistenceObject;
  };
}
