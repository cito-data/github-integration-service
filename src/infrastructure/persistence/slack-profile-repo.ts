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
  ISlackProfileRepo,
  SlackProfileUpdateDto,
} from '../../domain/slack-profile/i-slack-profile-repo';
import {
  SlackProfile,
  SlackProfileProperties,
} from '../../domain/entities/slack-profile';
import { decrypt, encrypt } from './db/mongo-db';

interface SlackProfilePersistence {
  _id: ObjectId;
  channelId: string;
  channelName: string;
  accessToken: string;
  iv: string;
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
    dbConnection: Db
  ): Promise<SlackProfile | null> => {
    try {
      const result: any = await dbConnection
        .collection(collectionName)
        .findOne({ organizationId: sanitize(organizationId) });

      if (!result) return null;

      return this.#toEntity(await this.#buildProperties(result));
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack); 
    else if (error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  all = async (dbConnection: Db): Promise<SlackProfile[]> => {
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
      if(error instanceof Error) console.error(error.stack); 
    else if (error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  insertOne = async (
    slackProfile: SlackProfile,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(slackProfile)));

      if (!result.acknowledged)
        throw new Error(
          'SlackProfile creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack); 
    else if (error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  #buildUpdateFilter = async (
    updateDto: SlackProfileUpdateDto
  ): Promise<SlackProfileUpdateFilter> => {
    const setFilter: { [key: string]: unknown } = {};
    const pushFilter: { [key: string]: unknown } = {};

    if (updateDto.channelId) setFilter.channelId = updateDto.channelId;
    if (updateDto.channelName) setFilter.channelName = updateDto.channelName;
    if (updateDto.accessToken) {
      const encryptedToken = encrypt(updateDto.accessToken);
      setFilter.accessToken = encryptedToken;
    }

    return { $set: setFilter, $push: pushFilter };
  };

  updateOne = async (
    id: string,
    updateDto: SlackProfileUpdateDto,
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
      if(error instanceof Error) console.error(error.stack); 
    else if (error) console.trace(error);
    return Promise.reject(new Error(''));
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
      if(error instanceof Error) console.error(error.stack); 
    else if (error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  #toEntity = (props: SlackProfileProperties): SlackProfile =>
    SlackProfile.create(props);

  #buildProperties = async (
    slackProfile: SlackProfilePersistence
  ): Promise<SlackProfileProperties> => {
    const decryptedToken = decrypt({
      content: slackProfile.accessToken,
      iv: slackProfile.iv,
    });

    return {
      // eslint-disable-next-line no-underscore-dangle
      id: slackProfile._id.toHexString(),
      organizationId: slackProfile.organizationId,
      channelId: slackProfile.channelId,
      channelName: slackProfile.channelName,
      accessToken: decryptedToken,
    };
  };

  #toPersistence = async (slackProfile: SlackProfile): Promise<Document> => {
    const encryptedToken = encrypt(slackProfile.accessToken);

    const persistenceObject: SlackProfilePersistence = {
      _id: ObjectId.createFromHexString(slackProfile.id),
      organizationId: slackProfile.organizationId,
      channelId: slackProfile.channelId,
      channelName: slackProfile.channelName,
      accessToken: encryptedToken.content,
      iv: encryptedToken.iv,
    };

    return persistenceObject;
  };
}
