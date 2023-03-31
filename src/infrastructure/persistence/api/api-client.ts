import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface BaseAuthConfig {
  type: 'snowflake' | 'mongodb' | 'jwt';
}

const isBaseAuthConfig = (authConfig: unknown): authConfig is BaseAuthConfig =>
  !!authConfig && typeof authConfig === 'object' && 'type' in authConfig;

export interface SnowflakeAuthConfig extends BaseAuthConfig {
  targetOrgId: string;
  username: string;
  accountId: string;
  type: 'snowflake';
}

const isSnowflakeAuthConfig = (
  authConfig: unknown
): authConfig is SnowflakeAuthConfig =>
  isBaseAuthConfig(authConfig) && authConfig.type === 'snowflake';

export interface MongoAuthConfig extends BaseAuthConfig {
  type: 'mongodb';
}

interface JwtAuthConfig extends BaseAuthConfig {
  token: string;
  type: 'jwt';
}

const isJwtAuthConfig = (authConfig: unknown): authConfig is JwtAuthConfig =>
  isBaseAuthConfig(authConfig) && authConfig.type === 'jwt';

const getApiClient = (
  baseURL: string,
  authConfig: SnowflakeAuthConfig | MongoAuthConfig | JwtAuthConfig
): AxiosInstance => {
  const api = axios.create({
    baseURL,
  });

  api.interceptors.request.use(async (config): Promise<AxiosRequestConfig> => {
    try {
      if (isJwtAuthConfig(authConfig))
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${authConfig.token}`,
          },
        };

      let jwt: string;
      if (isSnowflakeAuthConfig(authConfig)) {
        const { passphrase, prefix, suffix } =
          appConfig.snowflake.privateKeyConfig;

        const keyname = `${prefix}${authConfig.targetOrgId}${suffix}`;

        jwt = await generateSfJwt(
          passphrase,
          authConfig.accountId,
          authConfig.username,
          keyname
        );
      } else throw new Error('mongodb auth not implemented');

      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${jwt}`,
        },
      };
    } catch (e: any) {
      throw new Error(
        `An error occured while getting Snowflake access token: ${
          typeof e === 'string' ? e : e.message
        }`
      );
    }
  });

  return api;
};
export default getApiClient;
