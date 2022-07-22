import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { App, createNodeMiddleware } from 'octokit';
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

  githubApp.webhooks.on('push', async ({ octokit, payload }) => {
    const endpoint = 'GET /repos/{owner}/{repo}/contents/{path}';

    type ContentResponseType = Endpoints[typeof endpoint]['response'];
    const response: ContentResponseType = await octokit.request(endpoint, {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path: 'README.md',
    });

    if (response.status !== 200) throw new Error('Reading data failed');

    // todo - include type checking
    const { data }: any = response;

    const { content, encoding } = data;

    if (typeof content !== 'string')
      throw new Error(
        'Did not receive content field in string format from API'
      );
    if (encoding !== 'base64') throw new Error('Unexpected encoding type');

    const buffer = Buffer.from(content, encoding);
    const text = buffer.toString('utf-8');

    console.log(text);
  });

  githubApp.webhooks.on('installation', async ({ payload }) => {
    console.log(payload.action, 'installation-action');
    console.log(payload.repositories, 'target-repositories');
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
          `App listening on port: ${this.#config.port} in ${
            this.#config.mode
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
