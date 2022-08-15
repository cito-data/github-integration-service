import { InjectionMode, asClass, createContainer } from 'awilix';

import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateCitoSnowflakeEnv } from '../domain/cito-snowflake-env/create-cito-snowflake-env';
import { CreateSlackProfile } from '../domain/slack-profile/create-slack-profile';
import { ReadSlackProfile } from '../domain/slack-profile/read-slack-profile';
import { CreateSnowflakeProfile } from '../domain/snowflake-profile/create-snowflake-profile';
import { ReadSnowflakeProfile } from '../domain/snowflake-profile/read-snowflake-profile';
import { ReadSnowflakeProfiles } from '../domain/snowflake-profile/read-snowflake-profiles';
import { QuerySnowflake } from '../domain/snowflake-query/query-snowflake';
import AccountApiRepo from './persistence/account-api-repo';
import Dbo from './persistence/db/mongo-db';
import SlackProfileRepo from './persistence/slack-profile-repo';
import SnowflakeProfileRepo from './persistence/snowflake-profile-repo';
import SnowflakeQueryRepo from './persistence/snowflake-query-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createSnowflakeProfile: asClass(CreateSnowflakeProfile),
  createSlackProfile: asClass(CreateSlackProfile),
  createCitoSnowflakeEnv: asClass(CreateCitoSnowflakeEnv),

  readSnowflakeProfile: asClass(ReadSnowflakeProfile),
  readSlackProfile: asClass(ReadSlackProfile),
  readSnowflakeProfiles: asClass(ReadSnowflakeProfiles),
  
  querySnowflake: asClass(QuerySnowflake),

  getAccounts: asClass(GetAccounts),

  snowflakeProfileRepo: asClass(SnowflakeProfileRepo),
  slackProfileRepo: asClass(SlackProfileRepo),
  snowflakeQueryRepo: asClass(SnowflakeQueryRepo),

  accountApiRepo: asClass(AccountApiRepo),

  dbo: asClass(Dbo).singleton()
});

export default iocRegister;
