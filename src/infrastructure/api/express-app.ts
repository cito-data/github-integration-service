import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createNodeMiddleware } from 'octokit';

import compression from 'compression';
import morgan from 'morgan';
import v1Router from './routes/v1';
import iocRegister from '../ioc-register';
import Dbo from '../persistence/db/mongo-db';
import githubMiddleware from './github-middleware';
import { appConfig } from '../../config';

export default class ExpressApp {
  #expressApp: Application;

  #dbo: Dbo;

  constructor() {
    this.#expressApp = express();
    this.#dbo = iocRegister.resolve('dbo');
  }

  async start(runningLocal: boolean): Promise<Application> {
    try {
      await this.#dbo.connectToServer();

      this.configApp();

      if (runningLocal)
        this.#expressApp.listen(appConfig.express.port, () => {
          console.log(
            `App running under pid ${process.pid} and listening on port: ${appConfig.express.port} in ${appConfig.express.mode} mode`
          );
        });

      return this.#expressApp;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  private configApp(): void {
    this.#expressApp.use(morgan('combined'));
    this.#expressApp.use(express.json());
    this.#expressApp.use(express.urlencoded({ extended: true }));
    this.#expressApp.use(cors());
    this.#expressApp.use(compression());
    this.#expressApp.use(helmet());
    // listens on /api/github/webhooks
    this.#expressApp.use(
      createNodeMiddleware(
        githubMiddleware(
          iocRegister.resolve('createMetadata'),
          this.#dbo.dbConnection
        )
      )
    );
    this.#expressApp.use(v1Router);
  }
}
