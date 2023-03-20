import { Router } from 'express';
import githubRoutes from './github-routes';
import snowflakeRoutes from './snowflake-routes';
import slackRoutes from './slack-routes';
import { appConfig } from '../../../config';

const version = 'v1';

const v1Router = Router();

v1Router.get('/', (req, res) =>
  res.json({
    message: "Hi, we're up! Please provide the path to your desired endpoint",
  })
);

v1Router.get(`/${appConfig.express.apiRoot}/${version}/`, (req, res) =>
  res.json({ message: `The most recent version is ${version}` })
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/snowflake`,
  snowflakeRoutes
);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/slack`, slackRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/github`, githubRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/billing`, githubRoutes);

export default v1Router;
