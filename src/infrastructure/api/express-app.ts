import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
// eslint-disable-next-line import/no-extraneous-dependencies
import fetch from 'node-fetch';
import { App, createNodeMiddleware, Octokit } from 'octokit';
import { Endpoints } from '@octokit/types';
import v1Router from './routes/v1';
import iocRegister from '../ioc-register';
import Dbo from '../persistence/db/mongo-db';

interface AppConfig {
  port: number;
  mode: string;
}

interface GithubConfig {
  privateKey: string;
  appId: number;
  webhookSecret: string;
  clientId: string;
  clientSecret: string;
}

const githubIntegrationMiddleware = (config: GithubConfig): App => {
  const githubApp = new App({
    appId: config.appId,
    privateKey: config.privateKey,
    webhooks: {
      secret: config.webhookSecret,
    },
    oauth: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    },
  });

  const requestLineageCreation = async (catalogText: string, manifestText: string): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/lineage', {
        method: 'POST',
        body: JSON.stringify({
          catalog: catalogText,
          manifest: manifestText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error with status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log('error message: ', error.message);
      } else {
        console.log('unexpected error: ', error);
      }
    }
  };

  githubApp.webhooks.on('push', async ({ payload }) => {

    const octokit = new Octokit({
      auth:
        // token
        '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'
    });

    const catalogRes = await octokit.request('GET /search/code', {
      q: `filename:catalog+extension:json+repo:${payload.repository.owner.login}/${payload.repository.name}`
    });


    let { data }: any = catalogRes;
    let { items } = data;

    if (items.length > 1)
      throw Error('More than 1 catalog found');

    let [ item ] = items;
    let { path } = item;
    console.log(path);


    const endpoint = 'GET /repos/{owner}/{repo}/contents/{path}';

    type ContentResponseType = Endpoints[typeof endpoint]['response'];
    const catalogResponse: ContentResponseType = await octokit.request(endpoint, {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path,
    });

    if (catalogResponse.status !== 200)
      throw new Error('Reading catalog failed');

    // todo - include type checking
    ({ data } = catalogResponse);
    let { content, encoding } = data;

    if (typeof content !== 'string')
      throw new Error(
        'Did not receive content field in string format from API'
      );
    if (encoding !== 'base64')
      throw new Error('Unexpected encoding type');

    const catalogBuffer = Buffer.from(content, encoding);
    const catalogText = catalogBuffer.toString('utf-8');

    console.log(catalogText);


    const manifestRes = await octokit.request('GET /search/code', {
      q: `filename:manifest+extension:json+repo:${payload.repository.owner.login}/${payload.repository.name}`
    });

    ({ data } = manifestRes);
    ({ items } = data);

    if (items.length > 1)
      throw Error('More than 1 manifest found');

    ([ item ] = items);
    ({path} = item);
    console.log(path);


    const manifestResponse: ContentResponseType = await octokit.request(endpoint, {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path,

    });

    if (manifestResponse.status !== 200)
      throw new Error('Reading manifest failed');

    // todo - include type checking
    ({ data } = manifestResponse);
    ({ content, encoding } = data);

    if (typeof content !== 'string')
      throw new Error(
        'Did not receive content field in string format from API'
      );
    if (encoding !== 'base64')
      throw new Error('Unexpected encoding type');

    const manifestBuffer = Buffer.from(content, encoding);
    const manifestText = manifestBuffer.toString('utf-8');

    console.log(manifestText);

    requestLineageCreation(catalogText, manifestText);

  });

  githubApp.webhooks.on('installation', async ({ payload }) => {
    console.log(payload.action, 'installation-action');
    console.log(payload.repositories, 'target-repositories');
    console.log('hello');
  });

  // githubApp.oauth.on("token", async ({ token, octokit }) => {
  //   const { data } = await octokit.request("GET /user");
  //   console.log(`Token retrieved for ${data.login}`);
  //   console.log(token, 'received token');

  // });

  return githubApp;
};

export default class ExpressApp {
  #expressApp: Application;

  #config: AppConfig;

  #githubConfig: GithubConfig;

  constructor(config: AppConfig, githubConfig: GithubConfig) {
    this.#expressApp = express();
    this.#config = config;
    this.#githubConfig = githubConfig;
  }

  start = (): Application => {
    const dbo: Dbo = iocRegister.resolve('dbo');

    dbo.connectToServer((err) => {
      if (err) {
        console.error(err);
        process.exit();
      }

      this.#expressApp.listen(this.#config.port, () => {
        console.log(
          `App listening on port: ${this.#config.port} in ${this.#config.mode
          } mode`
        );
      });
    });
    this.configApp();

    return this.#expressApp;
  };

  private configApp(): void {
    this.#expressApp.use(
      createNodeMiddleware(githubIntegrationMiddleware(this.#githubConfig))
    );
    this.#expressApp.use(express.json());
    this.#expressApp.use(express.urlencoded({ extended: true }));
    this.#expressApp.use(cors());
    // this.#expressApp.use(compression());
    // // this.#expressApp.use(morgan("combined"));
    this.#expressApp.use(helmet());
    this.#expressApp.use(v1Router);
  }
}

