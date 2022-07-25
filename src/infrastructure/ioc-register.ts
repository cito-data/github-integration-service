import { InjectionMode, asClass, createContainer } from 'awilix';

import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateSnowflakeProfile } from '../domain/snowflake-profile/create-snowflake-profile';
import { ReadSnowflakeProfile } from '../domain/snowflake-profile/read-snowflake-profile';
import { QuerySnowflake } from '../domain/snowflake-query/query-snowflake';
import AccountApiRepo from './persistence/account-api-repo';
import Dbo from './persistence/db/mongo-db';
import SnowflakeProfileRepo from './persistence/snowflake-profile-repo';
import SnowflakeQueryRepo from './persistence/snowflake-query-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createSnowflakeProfile: asClass(CreateSnowflakeProfile),

  readSnowflakeProfile: asClass(ReadSnowflakeProfile),
  
  querySnowflake: asClass(QuerySnowflake),

  getAccounts: asClass(GetAccounts),

  snowflakeProfileRepo: asClass(SnowflakeProfileRepo),
  snowflakeQueryRepo: asClass(SnowflakeQueryRepo),

  accountApiRepo: asClass(AccountApiRepo),

  dbo: asClass(Dbo).singleton()
});

export default iocRegister;
