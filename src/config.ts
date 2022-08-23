import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const githubPrivateKey = process.env.GITHUB_PRIVATE_KEY;
if (!githubPrivateKey) throw new Error('Private key not available');

const githubAppId = process.env.GITHUB_APP_IDENTIFIER
  ? parseInt(process.env.GITHUB_APP_IDENTIFIER, 10)
  : '';
if (!githubAppId) throw new Error('App id not available');

const githubWebhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
if (!githubWebhookSecret) throw new Error('Webhook secret not available');

const githubClientId = process.env.GITHUB_APP_CLIENT_ID;
if (!githubClientId) throw new Error('Client id not available');

const githubClientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
if (!githubClientSecret) throw new Error('Client secret not available');

const nodeEnv = process.env.NODE_ENV || 'development';
const defaultPort = 3002;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
const apiRoot = process.env.API_ROOT || 'api';

const getServiceDiscoveryNamespace = (): string | null => {
  switch (nodeEnv) {
    case 'development':
      return null;
    case 'test':
      return 'integration-staging';
    case 'production':
      return 'integration';
    default:
      throw new Error('No valid nodenv value provided');
  }
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
  const key = fs.readFileSync('./master-key.txt');
  switch (nodeEnv) {
    case 'development': {
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
        url: process.env.DATABASE_URL_PROD || '',
        dbName: process.env.DATABASE_NAME_PROD || '',
        kmsProviders: { local: { key } },
        keyVaultNamespace: process.env.DATABASE_KEY_VAULT_NAMESPACE || '',
        dataKeyId: Buffer.from(
          process.env.DATABASE_DATA_KEY_ID || '',
          'base64'
        ),
      };
    default:
      throw new Error('Node environment mismatch');
  }
};

const getCognitoUserPoolId = (): string => {
  switch (nodeEnv) {
    case 'development':
      return 'eu-central-1_0Z8JhFj8z';
    case 'test':
      return '';
    case 'production':
      return 'eu-central-1_0muGtKMk3';
    default:
      throw new Error('No valid nodenv provided');
  }
};
export interface SystemInternalAuthConfig {
  clientSecret: string;
  clientId: string;
  tokenUrl: string;
}

const getSystemInternalAuthConfig = (): SystemInternalAuthConfig => {
  switch (nodeEnv) {
    case 'development': {
      const clientSecret = process.env.SYSTEM_INTERNAL_AUTH_CLIENT_SECRET_DEV || '';
      if (!clientSecret) throw new Error('auth client secret missing');

      const clientId = '3o029nji154v0bm109hkvkoi5h';
      const tokenUrl =
        'https://auth-cito-dev.auth.eu-central-1.amazoncognito.com/oauth2/token';
      return { clientSecret, clientId, tokenUrl };
    }
    case 'test': {
      const clientSecret =
        process.env.AUTH_SCHEDULER_CLIENT_SECRET_STAGING || '';
      if (!clientSecret) throw new Error('auth client secret missing');

      const clientId = '';
      const tokenUrl = '';
      return { clientSecret, clientId, tokenUrl };
    }
    case 'production': {
      const clientSecret = process.env.SYSTEM_INTERNAL_AUTH_CLIENT_SECRET_PROD || '';
      if (!clientSecret) throw new Error('auth client secret missing');

      const clientId = '54n1ig9sb07d4d9tiihdi0kifq';
      const tokenUrl = 'https://auth.citodata.com/oauth2/token';
      return { clientSecret, clientId, tokenUrl };
    }
    default:
      throw new Error('node env misconfiguration');
  }
};

export const appConfig = {
  express: {
    port,
    mode: nodeEnv,
    apiRoot,
  },
  cloud: {
    systemInternalAuthConfig: getSystemInternalAuthConfig(),
    serviceDiscoveryNamespace: getServiceDiscoveryNamespace(),
    userPoolId: getCognitoUserPoolId(),
    region: 'eu-central-1',
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
    privateKey: githubPrivateKey,
    appId: githubAppId,
    webhookSecret: githubWebhookSecret,
    clientId: githubClientId,
    clientSecret: githubClientSecret,
  },
};
