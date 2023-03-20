import { Router } from 'express';
import app from '../../ioc-register';
import CreatePaymentProfileController from '../controllers/create-payment-profile-controller';
import ReadPaymentProfileController from '../controllers/read-payment-profile-controller';
import UpdatePaymentProfileController from '../controllers/update-payment-profile-controller';
import DeletePaymentProfileController from '../controllers/delete-payment-profile-controller';
import ReadPaymentAccessTokenController from '../controllers/read-payment-access-token-controller';

const paymentRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const createPaymentProfileController = new CreatePaymentProfileController(
  app.resolve('createPaymentProfile'),
  getAccounts,
  dbo
);

paymentRoutes.post('/create-checkout-session', async (req, res) => 
paymentRoutes.post('/token', (req, res) => {
  readPaymentAccessTokenController.execute(req, res);
});

export default paymentRoutes;
