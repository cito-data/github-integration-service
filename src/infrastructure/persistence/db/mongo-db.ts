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

  connectToServer = (callback: (err?: unknown) => unknown): any => {
    this.#client.connect((err, db) => {
      if (err || !db) {
        return callback(err);
      }

      this.#dbConnection = db.db(appConfig.mongodb.dbName);
      console.log('Successfully connected to MongoDB.');

      this.#encryption = new ClientEncryption(this.#client, {
        keyVaultNamespace: appConfig.mongodb.keyVaultNamespace,
        kmsProviders: appConfig.mongodb.kmsProviders,
      });

      return callback();
    });
  };
}
