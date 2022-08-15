import { Router } from 'express';
import { apiRoot } from '../../../config';
import githubRoutes from './github-routes';
import snowflakeRoutes from './snowflake-routes';
import slackRoutes from './slack-routes';

const version = 'v1';

const v1Router = Router();

v1Router.get('/', (req, res) => res.json({ message: `Yo we're up` }));

v1Router.get(`/${apiRoot}/${version}/`, (req, res) => res.json({ message: `The most recent version is ${version}` }));

v1Router.use(`/${apiRoot}/${version}/snowflake`, snowflakeRoutes);

v1Router.use(`/${apiRoot}/${version}/slack`, slackRoutes);

v1Router.use(`/${apiRoot}/github`, githubRoutes);

export default v1Router;
