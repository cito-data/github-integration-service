import { Router } from 'express';
import { apiRoot } from '../../../config';
import snowflakeRoutes from './snowflake-routes';

const version = 'v1';

const v1Router = Router();

v1Router.get('/', (req, res) => res.json({ message: `Yo we're up` }));

v1Router.get(`/${apiRoot}/${version}/`, (req, res) => res.json({ message: `The most recent version is ${version}` }));

v1Router.use(`/${apiRoot}/${version}/snowflake`, snowflakeRoutes);

v1Router.post('/api/github/webhooks', (req, res) => {
    console.log(req);
    const {body} = req;
    console.log(body);
    // console.log
  
    res.send('success with smee');
    
  });

export default v1Router;
