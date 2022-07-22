import { Router } from 'express';
import app from '../../ioc-register';
import CreateSnowflakeProfileController from '../controllers/create-snowflake-profile-controller';
import CrudSnowflakeResourceController from '../controllers/crud-snowflake-resource-controller';
import ReadSnowflakeProfileController from '../controllers/read-snowflake-profile-controller';

const snowflakeRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const createSnowflakeProfileController = new CreateSnowflakeProfileController(
  app.resolve('createSnowflakeProfile'),
  getAccounts,
  dbo
);

const readSnowflakeProfileController = new ReadSnowflakeProfileController(
  app.resolve('readSnowflakeProfile'),
  getAccounts,
  dbo
);

const crudSnowflakeResourceController = new CrudSnowflakeResourceController(
  app.resolve('crudSnowflakeResource'),
  getAccounts,
  dbo
);

snowflakeRoutes.post('/profile', (req, res) => {
  createSnowflakeProfileController.execute(req, res);
});

snowflakeRoutes.get('/profile', (req, res) => {
  readSnowflakeProfileController.execute(req, res);
});

snowflakeRoutes.post('/resource', (req, res) => {
  crudSnowflakeResourceController.execute(req, res);
});

export default snowflakeRoutes;
