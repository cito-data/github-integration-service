import { Router } from 'express';
import app from '../../ioc-register';
import CreateSlackInteractionController from '../controllers/create-slack-interaction-controller';
import CreateSlackProfileController from '../controllers/create-slack-profile-controller';
import JoinSlackConversationController from '../controllers/join-slack-conversation-controller';
import ReadSlackConversationsController from '../controllers/read-slack-conversations-controller';
import ReadSlackProfileController from '../controllers/read-slack-profile-controller';
import SendSlackQualAlertController from '../controllers/send-slack-qual-alert-controller';
import SendSlackQuantAlertController from '../controllers/send-slack-quant-alert-controller';
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

const sendSlackQualAlertController = new SendSlackQualAlertController(
  app.resolve('sendSlackQualAlert'),
  getAccounts,
  dbo
);

const sendSlackQuantAlertController = new SendSlackQuantAlertController(
  app.resolve('sendSlackQuantAlert'),
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

const createSlackInteractionController = new CreateSlackInteractionController(
  app.resolve('createSlackInteraction'),
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

slackRoutes.post('/alert/quant', (req, res) => {
  sendSlackQuantAlertController.execute(req, res);
});

slackRoutes.post('/alert/qual', (req, res) => {
  sendSlackQualAlertController.execute(req, res);
});

slackRoutes.post('/conversation/join', (req, res) => {
  joinSlackConversationController.execute(req, res);
});

slackRoutes.get('/conversations', (req, res) => {
  readSlackConversationsController.execute(req, res);
});

slackRoutes.post('/interaction', (req, res) => {
  createSlackInteractionController.execute(req, res);
});

export default slackRoutes;
