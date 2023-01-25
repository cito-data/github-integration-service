import { InjectionMode, asClass, createContainer } from 'awilix';

import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateCitoSnowflakeEnv } from '../domain/cito-snowflake-env/create-cito-snowflake-env';
import { CreateSlackProfile } from '../domain/slack-profile/create-slack-profile';
import { ReadSlackProfile } from '../domain/slack-profile/read-slack-profile';
import { UpdateSlackProfile } from '../domain/slack-profile/update-slack-profile';
import { CreateSnowflakeProfile } from '../domain/snowflake-profile/create-snowflake-profile';
import { ReadSnowflakeProfile } from '../domain/snowflake-profile/read-snowflake-profile';
import { CreateGithubProfile } from '../domain/github-profile/create-github-profile';
import { ReadGithubProfile } from '../domain/github-profile/read-github-profile';
import { QuerySnowflake } from '../domain/snowflake-api/query-snowflake';
import AccountApiRepo from './persistence/account-api-repo';
import Dbo from './persistence/db/mongo-db';
import SlackProfileRepo from './persistence/slack-profile-repo';
import SnowflakeProfileRepo from './persistence/snowflake-profile-repo';
import GithubProfileRepo from './persistence/github-profile-repo';
import SnowflakeApiRepo from './persistence/snowflake-api-repo';
import { SendSlackQuantAlert } from '../domain/slack-api/send-quant-alert';
import { GetSlackConversations } from '../domain/slack-api/get-conversations';
import SlackApiRepo from './persistence/slack-api-repo';
import { JoinSlackConversation } from '../domain/slack-api/join-conversation';
import { UpdateGithubProfile } from '../domain/github-profile/update-github-profile';
import { DeleteGithubProfile } from '../domain/github-profile/delete-github-profile';
import { UpdateSnowflakeProfile } from '../domain/snowflake-profile/update-snowflake-profile';
import { GetGithubAccessToken } from '../domain/github-api/get-access-token';
import GithubApiRepo from './persistence/github-api-repo';
import { CreateMetadata } from '../domain/metadata/create-metadata';
import MetadataRepo from './persistence/metadata-repo';
import { PostLineage } from '../domain/lineage-api/post-lineage';
import LineageApiRepo from './persistence/lineage-api-repo';
import { SendSlackQualAlert } from '../domain/slack-api/send-qual-alert';
import { CreateSlackInteraction } from '../domain/slack-interaction/create-slack-interaction';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createSnowflakeProfile: asClass(CreateSnowflakeProfile),
  createSlackProfile: asClass(CreateSlackProfile),
  createGithubProfile: asClass(CreateGithubProfile),
  createCitoSnowflakeEnv: asClass(CreateCitoSnowflakeEnv),
  createMetadata: asClass(CreateMetadata),
  createSlackInteraction: asClass(CreateSlackInteraction),

  deleteGithubProfile: asClass(DeleteGithubProfile),

  updateSlackProfile: asClass(UpdateSlackProfile),
  updateGithubProfile: asClass(UpdateGithubProfile),
  updateSnowflakeProfile: asClass(UpdateSnowflakeProfile),

  readSnowflakeProfile: asClass(ReadSnowflakeProfile),
  readSlackProfile: asClass(ReadSlackProfile),
  readGithubProfile: asClass(ReadGithubProfile),

  querySnowflake: asClass(QuerySnowflake),

  getGithubAccessToken: asClass(GetGithubAccessToken),

  sendSlackQualAlert: asClass(SendSlackQualAlert),
  sendSlackQuantAlert: asClass(SendSlackQuantAlert),
  getSlackConversations: asClass(GetSlackConversations),
  joinSlackConversation: asClass(JoinSlackConversation),

  getAccounts: asClass(GetAccounts),
  postLineage: asClass(PostLineage),

  snowflakeProfileRepo: asClass(SnowflakeProfileRepo),
  slackProfileRepo: asClass(SlackProfileRepo),
  githubProfileRepo: asClass(GithubProfileRepo),
  metadataRepo: asClass(MetadataRepo),

  snowflakeApiRepo: asClass(SnowflakeApiRepo),
  slackApiRepo: asClass(SlackApiRepo),
  githubApiRepo: asClass(GithubApiRepo),

  accountApiRepo: asClass(AccountApiRepo),
  lineageApiRepo: asClass(LineageApiRepo),

  dbo: asClass(Dbo).singleton(),
});

export default iocRegister;
