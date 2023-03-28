import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const encodeData = (data: { [key: string]: string }): string =>
  Object.entries(data)
    .map(
      (entry) =>
        `${encodeURIComponent(entry[0])}=${encodeURIComponent(entry[1])}`
    )
    .join('&');

const getApiClient = (
  baseURL: string,
  authConfig: {
    redirectUri: string;
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  },
  accessToken?: string
): AxiosInstance => {
  const api = axios.create({
    baseURL,
  });

  api.interceptors.request.use(async (config): Promise<AxiosRequestConfig> => {
    try {
      if (accessToken)
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        };

      const tokenParams = {
        redirect_uri: authConfig.redirectUri,
        refresh_token: authConfig.refreshToken,
        grant_type: 'refresh_token',
      };

      const result = await axios.post(
        `${baseURL}/oauth/token-request`,
        encodeData({ ...tokenParams }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${authConfig.clientId}:${authConfig.clientSecret}`
            ).toString('base64')}`,
          },
        }
      );

      if (result.status !== 201) throw new Error(result.statusText);

      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${result.data.access_token}`,
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
