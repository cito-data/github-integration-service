// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult, ObjectId } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { IMetadataRepo } from '../../domain/metadata/i-metadata-repo';
import { Metadata } from '../../domain/entities/metadata';

interface MetadataPersistence {
  _id: ObjectId;
  organizationId: string;
  installationId: string,
  catalogContent: string,
  manifestContent: string,
  createdOn: string
}

const collectionName = 'metadata';

export default class MetadataRepo implements IMetadataRepo {
  insertOne = async (metadata: Metadata, dbConnection: Db): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(metadata)));

      if (!result.acknowledged)
        throw new Error('Metadata creation failed. Insert not acknowledged');

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message); 
    else if (!(error instanceof Error) && error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };

  #toPersistence = async (metadata: Metadata): Promise<Document> => {

    const persistenceObject: MetadataPersistence = {
      _id: ObjectId.createFromHexString(metadata.id),
      organizationId: metadata.organizationId,
      installationId: metadata.installationId,
      catalogContent: metadata.catalogContent,
      manifestContent: metadata.manifestContent,
      createdOn: metadata.createdOn
    };

    return persistenceObject;
  };
}
