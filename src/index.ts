import ExpressApp from './infrastructure/api/express-app';
import { appConfig } from './config';

const expressApp = new ExpressApp(appConfig.express, appConfig.github);

expressApp.start(true);
