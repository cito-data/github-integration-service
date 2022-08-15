import { Router } from 'express';
import app from '../../ioc-register';
import CreateSlackProfileController from '../controllers/create-slack-profile-controller';
import JoinSlackConversationController from '../controllers/join-slack-conversation-controller';
import ReadSlackConversationsController from '../controllers/read-slack-conversations-controller';
import ReadSlackProfileController from '../controllers/read-slack-profile-controller';
import SendSlackAlertController from '../controllers/send-slack-alert-controller';
import UpdateSlackProfileController from '../controllers/update-slack-profile-controller';

const slackRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const createSlackProfileController = new CreateSlackProfileController(
  app.resolve('createSlackProfile'),
  getAccounts,
  dbo
);

const updateSlackProfileController = new UpdateSlackProfileController(
  app.resolve('updateSlackProfile'),
  getAccounts,
  dbo
);

const readSlackProfileController = new ReadSlackProfileController(
  app.resolve('readSlackProfile'),
  getAccounts,
  dbo
);

const sendSlackAlertController = new SendSlackAlertController(
  app.resolve('sendSlackAlert'),
  getAccounts,
  dbo
);

const readSlackConversationsController = new ReadSlackConversationsController(
  app.resolve('getSlackConversations'),
  getAccounts,
  dbo
);

const joinSlackConversationController = new JoinSlackConversationController(
  app.resolve('joinSlackConversation'),
  getAccounts,
  dbo
);

slackRoutes.post('/profile', (req, res) => {
  createSlackProfileController.execute(req, res);
});

slackRoutes.get('/profile', (req, res) => {
  readSlackProfileController.execute(req, res);
});

slackRoutes.patch('/profile', (req, res) => {
  updateSlackProfileController.execute(req, res);
});

slackRoutes.post('/alert', (req, res) => {
  sendSlackAlertController.execute(req, res);
});

slackRoutes.post('/conversation/join', (req, res) => {
  joinSlackConversationController.execute(req, res);
});

slackRoutes.get('/conversations', (req, res) => {
  readSlackConversationsController.execute(req, res);
});

export default slackRoutes;
