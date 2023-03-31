import dotenv from 'dotenv';
import path from 'path';

const dotenvConfig =
  process.env.NODE_ENV === 'development'
    ? { path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`) }
    : {};
dotenv.config(dotenvConfig);

const nodeEnv = process.env.NODE_ENV || 'development';
const defaultPort = 3002;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
const apiRoot = process.env.API_ROOT || 'api';

const getServiceDiscoveryNamespace = (): string | null => {
  switch (nodeEnv) {
    case 'development':
      return null;
    case 'staging':
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
      return `http://localhost:3006/model-feedback`;
    case 'staging':
      return `https://www.app-staging.citodata.com/model-feedback`;
    case 'production':
      return `https://www.app.citodata.com/model-feedback`;
    default:
      throw new Error('nodenv type not found');
  }
};

export interface MongoDbConfig {
  url: string;
  dbName: string;
  dataKeyId: string;
}

const getMongodbConfig = (): MongoDbConfig => ({
  url: process.env.DATABASE_URL || '',
  dbName: process.env.DATABASE_NAME || '',
  dataKeyId: process.env.DATABASE_DATA_KEY_ID || '',
});

const getCognitoUserPoolId = (): string => {
  switch (nodeEnv) {
    case 'development':
      return 'eu-central-1_0Z8JhFj8z';
    case 'staging':
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
      const clientSecret = process.env.SYSTEM_INTERNAL_AUTH_CLIENT_SECRET || '';
      if (!clientSecret) throw new Error('auth client secret missing');

      const clientId = '3o029nji154v0bm109hkvkoi5h';
      const tokenUrl =
        'https://auth-cito-dev.auth.eu-central-1.amazoncognito.com/oauth2/token';
      return { clientSecret, clientId, tokenUrl };
    }
    case 'staging': {
      throw new Error('Staging not configured');
    }
    case 'production': {
      const clientSecret = process.env.SYSTEM_INTERNAL_AUTH_CLIENT_SECRET || '';
      if (!clientSecret) throw new Error('auth client secret missing');

      const clientId = '54n1ig9sb07d4d9tiihdi0kifq';
      const tokenUrl = 'https://auth.citodata.com/oauth2/token';
      return { clientSecret, clientId, tokenUrl };
    }
    default: {
      throw new Error(`node env misconfiguration. Provided state: ${nodeEnv}`);
    }
  }
};

interface GithubConfig {
  privateKey: string;
  appId: number;
  webhookSecret: string;
  clientId: string;
  clientSecret: string;
}

const getGithubConfig = (): GithubConfig => {
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  if (!privateKey) throw new Error('Private key not available');

  const appId = process.env.GITHUB_APP_IDENTIFIER
    ? parseInt(process.env.GITHUB_APP_IDENTIFIER, 10)
    : undefined;
  if (!appId) throw new Error('App id not available');

  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('Webhook secret not available');

  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  if (!clientId) throw new Error('Client id not available');

  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
  if (!clientSecret) throw new Error('Client secret not available');

  return {
    privateKey: privateKey.replace(/\\n/gm, '\n'),
    appId,
    webhookSecret,
    clientId,
    clientSecret,
  };
};

export interface BaseUrlConfig {
  accountService: string;
  integrationService: string;
  lineageAnalysisService: string;
}

const getBaseUrlConfig = (): BaseUrlConfig => {
  const integrationService = process.env.BASE_URL_INTEGRATION_SERVICE;
  const accountService = process.env.BASE_URL_ACCOUNT_SERVICE;
  const lineageAnalysisService = process.env.BASE_URL_LINEAGE_ANALYSIS;

  if (!integrationService || !accountService || !lineageAnalysisService)
    throw new Error('Missing Base url env values');

  return { integrationService, accountService, lineageAnalysisService };
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
  mongodb: getMongodbConfig(),
  slack: {
    buttonBaseUrl: getSlackMessageButtonBaseUrl(),
  },
  snowflake: {
    userAgent: process.env.SNOWFLAKE_APPLICATION_NAME || 'Cito_CitoApp',
    redirectUri: 'https://www.app.citodata.com/auth/snowflake',
  },
  github: getGithubConfig(),
  baseUrl: getBaseUrlConfig(),
};
