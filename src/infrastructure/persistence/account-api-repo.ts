import axios, { AxiosRequestConfig } from 'axios';
import { URLSearchParams } from 'url';
import { appConfig } from '../../config';
import { AccountDto } from '../../domain/account-api/account-dto';
import { IAccountApiRepo } from '../../domain/account-api/i-account-api-repo';
import getRoot from '../shared/api-root-builder';

export default class AccountApiRepo implements IAccountApiRepo {
  #path = 'api/v1';

  #port = '8081';

  #prodGateway = 'p2krek4fsj.execute-api.eu-central-1.amazonaws.com/production';

  getBy = async (
    params: URLSearchParams,
    jwt: string
  ): Promise<AccountDto[]> => {
    try {
      let gateway = this.#port;
      if(appConfig.express.mode === 'production') gateway = this.#prodGateway;

      const apiRoot = await getRoot(gateway, this.#path);

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
        params,
      };

      const response = await axios.get(`${apiRoot}/accounts`, config);
      const jsonResponse = response.data;
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if(error instanceof Error && error.message) console.trace(error.message); 
    else if (!(error instanceof Error) && error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };
}
