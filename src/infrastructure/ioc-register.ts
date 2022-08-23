import { InjectionMode, asClass, createContainer } from 'awilix';

import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateCitoSnowflakeEnv } from '../domain/cito-snowflake-env/create-cito-snowflake-env';
import { CreateSlackProfile } from '../domain/slack-profile/create-slack-profile';
import { ReadSlackProfile } from '../domain/slack-profile/read-slack-profile';
import { UpdateSlackProfile } from '../domain/slack-profile/update-slack-profile';
import { CreateSnowflakeProfile } from '../domain/snowflake-profile/create-snowflake-profile';
import { ReadSnowflakeProfile } from '../domain/snowflake-profile/read-snowflake-profile';
import { ReadSnowflakeProfiles } from '../domain/snowflake-profile/read-snowflake-profiles';
import { CreateGithubProfile } from '../domain/github-profile/create-github-profile';
import { ReadGithubProfile } from '../domain/github-profile/read-github-profile';
import { QuerySnowflake } from '../domain/snowflake-api/query-snowflake';
import AccountApiRepo from './persistence/account-api-repo';
import Dbo from './persistence/db/mongo-db';
import SlackProfileRepo from './persistence/slack-profile-repo';
import SnowflakeProfileRepo from './persistence/snowflake-profile-repo';
import GithubProfileRepo from './persistence/github-profile-repo';
import SnowflakeApiRepo from './persistence/snowflake-api-repo';
import { SendSlackAlert } from '../domain/slack-api/send-alert';
import { GetSlackConversations } from '../domain/slack-api/get-conversations';
import SlackApiRepo from './persistence/slack-api-repo';
import { JoinSlackConversation } from '../domain/slack-api/join-conversation';
import { UpdateGithubProfile } from '../domain/github-profile/update-github-profile';
import { DeleteGithubProfile } from '../domain/github-profile/delete-github-profile';
import { UpdateSnowflakeProfile } from '../domain/snowflake-profile/update-snowflake-profile';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createSnowflakeProfile: asClass(CreateSnowflakeProfile),
  createSlackProfile: asClass(CreateSlackProfile),
  createGithubProfile: asClass(CreateGithubProfile),
  createCitoSnowflakeEnv: asClass(CreateCitoSnowflakeEnv),

  deleteGithubProfile: asClass(DeleteGithubProfile),

  updateSlackProfile: asClass(UpdateSlackProfile),
  updateGithubProfile: asClass(UpdateGithubProfile),
  updateSnowflakeProfile: asClass(UpdateSnowflakeProfile),

  readSnowflakeProfile: asClass(ReadSnowflakeProfile),
  readSlackProfile: asClass(ReadSlackProfile),
  readGithubProfile: asClass(ReadGithubProfile),
  readSnowflakeProfiles: asClass(ReadSnowflakeProfiles),

  querySnowflake: asClass(QuerySnowflake),

  sendSlackAlert: asClass(SendSlackAlert),
  getSlackConversations: asClass(GetSlackConversations),
  joinSlackConversation: asClass(JoinSlackConversation),

  getAccounts: asClass(GetAccounts),

  snowflakeProfileRepo: asClass(SnowflakeProfileRepo),
  slackProfileRepo: asClass(SlackProfileRepo),
  githubProfileRepo: asClass(GithubProfileRepo),

  snowflakeApiRepo: asClass(SnowflakeApiRepo),
  slackApiRepo: asClass(SlackApiRepo),

  accountApiRepo: asClass(AccountApiRepo),

  dbo: asClass(Dbo).singleton(),
});

export default iocRegister;
