import { Router } from 'express';
import app from '../../ioc-register';
import CreateCitoSnowflakeEnvController from '../controllers/create-cito-snowflake-env-controller';
import CreateSnowflakeProfileController from '../controllers/create-snowflake-profile-controller';
import ReadSnowflakeProfileController from '../controllers/read-snowflake-profile-controller';
import UpdateSnowflakeProfileController from '../controllers/update-snowflake-profile-controller';

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

const createCitoSnowflakeEnv = new CreateCitoSnowflakeEnvController(
  app.resolve('createCitoSnowflakeEnv'),
  getAccounts,
  dbo
);

snowflakeRoutes.post('/profile', (req, res) => {
  createSnowflakeProfileController.execute(req, res);
});

const updateSnowflakeProfileController = new UpdateSnowflakeProfileController(
  app.resolve('updateSnowflakeProfile'),
  getAccounts,
  dbo
);

snowflakeRoutes.get('/profile', (req, res) => {
  readSnowflakeProfileController.execute(req, res);
});

snowflakeRoutes.patch('/profile', (req, res) => {
  updateSnowflakeProfileController.execute(req, res);
});

snowflakeRoutes.post('/init', (req, res) => {
  createCitoSnowflakeEnv.execute(req, res);
});

export default snowflakeRoutes;
