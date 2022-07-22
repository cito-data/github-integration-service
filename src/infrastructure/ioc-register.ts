import { InjectionMode, asClass, createContainer } from 'awilix';

import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateSnowflakeProfile } from '../domain/snowflake-profile/create-snowflake-profile';
import { ReadSnowflakeProfile } from '../domain/snowflake-profile/read-snowflake-profile';
import { CrudSnowflakeResource } from '../domain/snowflake-resource/crud-snowflake-resource';
import AccountApiRepo from './persistence/account-api-repo';
import Dbo from './persistence/db/mongo-db';
import SnowflakeProfileRepo from './persistence/snowflake-profile-repo';
import SnowflakeResourceRepo from './persistence/snowflake-resource-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createSnowflakeProfile: asClass(CreateSnowflakeProfile),

  readSnowflakeProfile: asClass(ReadSnowflakeProfile),
  
  crudSnowflakeResource: asClass(CrudSnowflakeResource),

  getAccounts: asClass(GetAccounts),

  snowflakeProfileRepo: asClass(SnowflakeProfileRepo),
  snowflakeResourceRepo: asClass(SnowflakeResourceRepo),

  accountApiRepo: asClass(AccountApiRepo),

  dbo: asClass(Dbo).singleton()
});

export default iocRegister;
