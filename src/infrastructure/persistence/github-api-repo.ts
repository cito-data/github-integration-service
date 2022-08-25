import axios, { AxiosRequestConfig } from "axios";
import { appConfig } from "../../config";
import { IGithubApiRepo } from "../../domain/github-api/i-github-api-repo";

export default class GithubApiRepo implements IGithubApiRepo {
  
  getAccessToken = async (
    code: string
  ): Promise<string> => {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
      };
     

      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          code,
          client_id: appConfig.github.clientId,
          client_secret: appConfig.github.clientSecret,
        },
        config
      );

      const jsonResponse = response.data;
      if (response.status !== 200) throw new Error(jsonResponse.message);
      if (!jsonResponse)
        throw new Error('Retrieval of github access token failed');
      return jsonResponse.access_token;
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };
}
