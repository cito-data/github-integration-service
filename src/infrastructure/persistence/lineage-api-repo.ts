import axios, { AxiosRequestConfig } from 'axios';
import { appConfig } from '../../config';
import { LineageDto } from '../../domain/lineage-api/lineage-dto';
import {
  ILineageApiRepo,
  PostLineagePayload,
} from '../../domain/lineage-api/i-lineage-api-repo';
import getRoot from '../shared/api-root-builder';

export default class LineageApiRepo implements ILineageApiRepo {
  #path = 'api/v1';

  #port = '3000';

  post = async (
    payload: PostLineagePayload,
    jwt: string
  ): Promise<LineageDto> => {
    try {
      if (appConfig.express.mode !== 'development')
        throw new Error(
          'Only suitable for local testing purposes in development mode'
        );

      const gateway = this.#port;

      const apiRoot = await getRoot(gateway, this.#path);

      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${jwt}` },
      };

      const response = await axios.post(`${apiRoot}/lineage`, payload, config);
      const jsonResponse = response.data;
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack); 
    else if (error) console.trace(error);
    return Promise.reject(new Error(''));
    }
  };
}
