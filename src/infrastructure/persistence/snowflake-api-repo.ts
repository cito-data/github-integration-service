import axios, { AxiosRequestConfig } from 'axios';
import { DbOptions } from '../../domain/services/i-db';
import { SnowflakeQuery } from '../../domain/value-types/snowflake-query';
import { ISnowflakeApiRepo } from '../../domain/snowflake-api/i-snowflake-api-repo';
import { appConfig } from '../../config';
import Result from '../../domain/value-types/transient-types/result';

interface TokenReqBodyBase {
  redirect_uri: string;
}

interface TokenReqBodyAuthCode extends TokenReqBodyBase {
  grant_type: 'authorization_code';
  code: string;
}

interface TokenReqBodyRefreshToken extends TokenReqBodyBase {
  grant_type: 'refresh_token';
  refresh_token: string;
}

export default class SnowflakeApiRepo implements ISnowflakeApiRepo {
  runQuery = async (
    query: string,
    options: DbOptions
  ): Promise<Result<SnowflakeQuery[]>> => {
    try {
      const OAUTH_CLIENT_SECRET = '3sfxEKKfpF46pdg9vr7T/qgj27T6DnWuLFwxLAb5oM8=';
      const OAUTH_CLIENT_ID = 'cRcdVP2/iRR/vrbvUqvuz5BStyc=';
      const accountId = 'lx38764';
      const region = 'eu-central-1';
      const accountUrl = `https://${accountId}.${region}.snowflakecomputing.com`;
    
      const redirectUri = 'https://google.com';
      // https://${accountId}.snowflakecomputing.com/oauth/authorize?client_id=${OAUTH_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}
    
      const code = undefined;
      const refreshToken =
        'ver:2-hint:7907450885-did:1014-ETMsDgAAAYch7JAmABRBRVMvQ0JDL1BLQ1M1UGFkZGluZwEAABAAED6UZCRrMtdltACetkn+G1oAAADweHZamnDR1HXWZZ5KSvuE5btJyMKNvKHgcshqh3eUUPkT+qaDXAzSQEaTCVI0+LoCsGc0VMnkeOCC5h+MSTUMopN1qBZMYbHSZ1n4JcQm6o7oStWs624bTkKKv9qP1kLS8wrvNdP4C9jbEzAy3bcXERIYfp0V1RphZK1o7rZIvPyWP5x2sDR7EpK2LVYCCWiCKCM6ZnoYHaMflSp4jCzVg1in1x9PVVRsjxEQy9BMyRVJ2D4iPK94hqZOgoPZ1T2R1BmrX2b12Dv4+wae2bR4VozN29X3X7r9KoNSadUZhhsb7InH3weuxTZ/tIjDJlUPABQp4/ELl/uH/qusDHCI+did4xYm1g==';
    
      let tokenParams: TokenReqBodyAuthCode | TokenReqBodyRefreshToken;
      if (refreshToken) {
        console.log('check if valid');
        if (false) {
          console.log('if not valid, send message to user to login again');
          throw new Error('refresh token expired');
        }
    
        tokenParams = {
          redirect_uri: redirectUri,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        };
      } else if (code) {
        tokenParams = {
          redirect_uri: redirectUri,
          code,
          grant_type: 'authorization_code',
        };
      } else {
        console.log('send message to user to login');
        throw new Error('no code or refresh token');
      }
    
      const token = await axios.post(
        `${accountUrl}/oauth/token-request`,
        encodeData({ ...tokenParams }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${OAUTH_CLIENT_ID}:${OAUTH_CLIENT_SECRET}`
            ).toString('base64')}`,
          },
        }
      );
    
      const queryData = {
        statement: 'select * from cito.observability.test_suites;',
        warehouse: 'CITO_WH',
        timeout: 10,
        // "bindings" : {
        //   "1" : {
        //     "type" : "FIXED",
        //     "value" : "123"
        //   }
        // }
      };
    
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.data.access_token}`,
          Accept: 'application/json',
          'Snowflake-Account': accountId,
        },
      };
    
      const result = await axios.post(
        `${accountUrl}/api/v2/statements`,
        queryData,
        config
      );
    
      console.log(result.data);
    
      return result.data;
    };
    
      
      
      
      
      
      
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };
}
