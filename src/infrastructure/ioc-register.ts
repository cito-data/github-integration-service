import { InjectionMode, asClass, createContainer } from 'awilix';

import { GetAccounts } from '../domain/account-api/get-accounts';
import MongoDb from './persistence/db/mongo-db';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  getAccounts: asClass(GetAccounts),
  db: asClass(MongoDb),
});

export default iocRegister;
