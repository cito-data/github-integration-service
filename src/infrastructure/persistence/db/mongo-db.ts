import crypto from 'crypto';
import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import { appConfig } from '../../../config';

export interface Hash {
  iv: string,
  content: string
}

const algorithm = 'aes-256-ctr';

export const encrypt = (text: string): Hash => {
    
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(appConfig.mongodb.dataKeyId, 'hex'), iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex')
  };
};

export const decrypt = (hash: Hash): string => {

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(appConfig.mongodb.dataKeyId, 'hex'), Buffer.from(hash.iv, 'hex'));

  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

  return decrpyted.toString();
};

export default class Dbo {
  #client = new MongoClient(appConfig.mongodb.url, {
    serverApi: ServerApiVersion.v1,
  });

  #dbConnection: Db | undefined;

  get client(): MongoClient {
    if (!this.#client)
      throw Error('Undefined client connection. Please connect to server first');
    return this.#client;
  }

  get dbConnection(): Db {
    if (!this.#dbConnection)
      throw Error('Undefined db connection. Please connect to server first');
    return this.#dbConnection;
  }

  connectToServer = async (): Promise<void> => {
    const db = await this.#client.connect();

    this.#dbConnection = db.db(appConfig.mongodb.dbName);
    console.log('Successfully connected to MongoDB.');
  };
}
