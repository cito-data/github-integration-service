import { Router } from 'express';
import app from '../../ioc-register';
import CreateGithubProfileController from '../controllers/create-github-profile-controller';
import ReadGithubProfileController from '../controllers/read-github-profile-controller';
import UpdateGithubProfileController from '../controllers/update-github-profile-controller';
import DeleteGithubProfileController from '../controllers/delete-github-profile-controller';
import ReadGithubAccessTokenController from '../controllers/read-github-access-token-controller';

const githubRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const createGithubProfileController = new CreateGithubProfileController(
  app.resolve('createGithubProfile'),
  getAccounts,
  dbo
);

const readGithubProfileController = new ReadGithubProfileController(
  app.resolve('readGithubProfile'),
  getAccounts,
  dbo
);

const updateGithubProfileController = new UpdateGithubProfileController(
  app.resolve('updateGithubProfile'),
  getAccounts,
  dbo
);

const deleteGithubProfileController = new DeleteGithubProfileController(
  app.resolve('deleteGithubProfile'),
  getAccounts,
  dbo
);

const readGithubAccessTokenController = new ReadGithubAccessTokenController(
  app.resolve('getGithubAccessToken'),
  getAccounts,
  dbo
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
githubRoutes.post('/webhooks', (req, res) => {
  console.log(req);
  const { body } = req;
  console.log(body);
});

githubRoutes.post('/profile', (req, res) => {
  createGithubProfileController.execute(req, res);
});

githubRoutes.get('/profile', (req, res) => {
  readGithubProfileController.execute(req, res);
});

githubRoutes.patch('/profile', (req, res) => {
  updateGithubProfileController.execute(req, res);
});

githubRoutes.delete('/profile', (req, res) => {
  deleteGithubProfileController.execute(req, res);
});

githubRoutes.post('/token', (req, res) => {
  readGithubAccessTokenController.execute(req, res);
});

export default githubRoutes;
