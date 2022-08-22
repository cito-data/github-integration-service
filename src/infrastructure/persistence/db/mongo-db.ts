import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import { ClientEncryption } from 'mongodb-client-encryption';
import { appConfig } from '../../../config';

export default class Dbo {
  #client = new MongoClient(appConfig.mongodb.url, {
    serverApi: ServerApiVersion.v1,
  });

  #encryption?: ClientEncryption;

  #dbConnection: Db | undefined;

  get dbConnection(): Db {
    if (!this.#dbConnection)
      throw Error('Undefined db connection. Please connect to server first');
    return this.#dbConnection;
  }

  get encryption(): ClientEncryption {
    if (!this.#encryption)
      throw Error('Undefined encryption object. Please define first');
    return this.#encryption;
  }

  connectToServer = async (): Promise<void> => {
    const db = await this.#client.connect();

    this.#dbConnection = db.db(appConfig.mongodb.dbName);
    console.log('Successfully connected to MongoDB.');

    this.#encryption = new ClientEncryption(this.#client, {
      keyVaultNamespace: appConfig.mongodb.keyVaultNamespace,
      kmsProviders: appConfig.mongodb.kmsProviders,
    });
  };
}
