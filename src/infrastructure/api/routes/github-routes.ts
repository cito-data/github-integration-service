import { Router } from 'express';
import app from '../../ioc-register';
import CreateGithubProfileController from '../controllers/create-github-profile-controller';
import ReadGithubProfileController from '../controllers/read-github-profile-controller';

const githubRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const createGithubProfileController = new CreateGithubProfileController(
    app.resolve('createGithubProfile'),
    getAccounts,
    dbo
  );

const readGithubProfileController = new ReadGithubProfileController(
    app.resolve('createGithubProfile'),
    getAccounts,
    dbo
  );

githubRoutes.post('/webhooks', (req, res) => {
    console.log(req);
    const {body} = req;
    console.log(body);
  
    res.send('success with smee');
    
});

githubRoutes.post('/profile', (req, res) => {
    createGithubProfileController.execute(req, res);    
});


githubRoutes.get('/profile', (req, res) => {
    readGithubProfileController.execute(req, res);    
});

export default githubRoutes;
