import { Router } from 'express';
import { apiRoot } from '../../../config';

const version = 'v1';

const v1Router = Router();

v1Router.get('/', (req, res) => res.json({ message: `Yo we're up` }));

v1Router.get(`/${apiRoot}/${version}/`, (req, res) => res.json({ message: `The most recent version is ${version}` }));

export default v1Router;
