import fs from 'fs';

const privateKey = process.env.GITHUB_PRIVATE_KEY;
if (!privateKey) throw new Error('Private key not available');

const appId = process.env.GITHUB_APP_IDENTIFIER
  ? (process.env.GITHUB_APP_IDENTIFIER, 10)
  : '';
if (!appId) throw new Error('App id not available');

const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
if (!webhookSecret) throw new Error('Webhook secret not available');

const clientId = process.env.GITHUB_APP_CLIENT_ID;
if (!clientId) throw new Error('Client id not available');

const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
if (!clientSecret) throw new Error('Client secret not available');

const nodeEnv = process.env.NODE_ENV || 'development';
const defaultPort = 3002;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
const apiRoot = process.env.API_ROOT || 'api';

const getServiceDiscoveryNamespace = (): string => {
  let namespace = '';

  switch (nodeEnv) {
    case 'test':
      namespace = 'integration-staging';
      break;
    case 'production':
      namespace = 'integration';
      break;
    default:
      break;
  }

  return namespace;
};

const getSlackMessageButtonBaseUrl = (): string => {
  switch (nodeEnv) {
    case 'development':
      return `http://localhost:3006/test`;
    case 'test':
      return `https://www.app-staging.citodata.com/test`;
    case 'production':
      return `https://www.app.citodata.com/test`;
    default:
      throw new Error('nodenv type not found');
  }
};

export interface MongoDbConfig {
  url: string;
  dbName: string;
  kmsProviders: any;
  keyVaultNamespace: string;
  dataKeyId: Buffer;
}

const getMongodbConfig = (): MongoDbConfig => {
  switch (nodeEnv) {
    case 'development': {
      const key = fs.readFileSync('./master-key.txt');
      return {
        url: process.env.DATABASE_DEV_URL || '',
        dbName: process.env.DATABASE_DEV_NAME || '',
        kmsProviders: { local: { key } },
        keyVaultNamespace: process.env.DATABASE_DEV_KEY_VAULT_NAMESPACE || '',
        dataKeyId: Buffer.from(
          process.env.DATABASE_DEV_DATA_KEY_ID || '',
          'base64'
        ),
      };
    }
    case 'test':
      return {
        url: process.env.DATABASE_TEST_URL || '',
        dbName: process.env.DATABASE_TEST_NAME || '',
        kmsProviders: {},
        keyVaultNamespace: process.env.DATABASE_TEST_KEY_VAULT_NAMESPACE || '',
        dataKeyId: Buffer.from(
          process.env.DATABASE_TEST_DATA_KEY_ID || '',
          'base64'
        ),
      };
    case 'production':
      return {
        url: process.env.DATABASE_URL || '',
        dbName: process.env.DATABASE_NAME || '',
        kmsProviders: {},
        keyVaultNamespace: process.env.DATABASE_KEY_VAULT_NAMESPACE || '',
        dataKeyId: Buffer.from(
          process.env.DATABASE_DATA_KEY_ID || '',
          'base64'
        ),
      };
    default:
      return {
        url: process.env.DATABASE_DEV_URL || '',
        dbName: process.env.DATABASE_DEV_URL || '',
        kmsProviders: {
          local: { key: process.env.DATABASE_DEV_KMS_KEY || '' },
        },
        keyVaultNamespace: process.env.DATABASE_DEV_KEY_VAULT_NAMESPACE || '',
        dataKeyId: Buffer.from(
          process.env.DATABASE_DEV_DATA_KEY_ID || '',
          'base64'
        ),
      };
  }
};

export const appConfig = {
  express: {
    port,
    mode: nodeEnv,
    apiRoot,
  },
  cloud: {
    serviceDiscoveryNamespace: getServiceDiscoveryNamespace(),
  },
  mongodb: {
    ...getMongodbConfig(),
  },
  slack: {
    buttonBaseUrl: getSlackMessageButtonBaseUrl(),
  },
  snowflake: {
    applicationName:
      process.env.SNOWFLAKE_APPLICATION_NAME || 'snowflake-connector',
  },
  github: {
    privateKey,
    appId,
    webhookSecret,
    clientId,
    clientSecret,
  },
};
