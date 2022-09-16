import { Endpoints } from '@octokit/types';
import axios, { AxiosRequestConfig } from 'axios';
import { TextEncoder, TextDecoder } from 'util';
import { App } from 'octokit';
import EventSource from 'eventsource';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GithubProfile } from '../../domain/entities/github-profile';
import { appConfig } from '../../config';
import getRoot from '../shared/api-root-builder';
import { CreateMetadata } from '../../domain/metadata/create-metadata';
import { DbConnection } from '../../domain/services/i-db';
import {
  UpdateGithubProfile,
  UpdateGithubProfileResponseDto,
} from '../../domain/github-profile/update-github-profile';

export interface GithubConfig {
  privateKey: string;
  appId: number;
  webhookSecret: string;
  clientId: string;
  clientSecret: string;
}

interface InternalLineageInvoke {
  internalInvokeType: string;
  auth: { jwt: string };
  req: { catalog: string; manifest: string; targetOrganizationId: string };
}

interface UpdateProfileProps {
  installationId: string;
  targetOrganizationId: string;
  firstLineageCreated?: boolean;
  repositoryNames?: string[];
}

export default (
  createMetadata: CreateMetadata,
  updateGithubProfile: UpdateGithubProfile,
  dbConnection: DbConnection
): App => {
  const githubApp = new App({
    appId: appConfig.github.appId,
    privateKey: appConfig.github.privateKey,
    webhooks: {
      secret: appConfig.github.webhookSecret,
    },
    oauth: {
      clientId: appConfig.github.clientId,
      clientSecret: appConfig.github.clientSecret,
    },
  });

  const getSelfApiRoute = async (): Promise<string> => {
    const gateway =
      appConfig.express.mode === 'production'
        ? 'wej7xjkvug.execute-api.eu-central-1.amazonaws.com/production'
        : '3002';

    const apiRoot = await getRoot(gateway, 'api/v1');

    return apiRoot;
  };

  const getJwt = async (): Promise<string> => {
    try {
      const configuration: AxiosRequestConfig = {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${appConfig.cloud.systemInternalAuthConfig.clientId}:${appConfig.cloud.systemInternalAuthConfig.clientSecret}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: appConfig.cloud.systemInternalAuthConfig.clientId,
        }),
      };

      const response = await axios.post(
        appConfig.cloud.systemInternalAuthConfig.tokenUrl,
        undefined,
        configuration
      );
      const jsonResponse = response.data;
      if (response.status !== 200) throw new Error(jsonResponse.message);
      if (!jsonResponse.access_token)
        throw new Error('Did not receive an access token');
      return jsonResponse.access_token;
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const getGithubProfile = async (
    params: URLSearchParams
  ): Promise<GithubProfile> => {
    try {
      const jwt = await getJwt();

      const configuration: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        params,
      };

      const apiRoot = await getSelfApiRoute();

      const response = await axios.get(
        `${apiRoot}/github/profile`,
        configuration
      );

      const jsonResponse = response.data;

      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const updateProfile = async (props: UpdateProfileProps): Promise<any> => {
    try {
      console.log('Updating Github profile...');

      const { targetOrganizationId, ...updateDto } = props;

      const useCaseResult: UpdateGithubProfileResponseDto =
        await updateGithubProfile.execute(
          {
            targetOrganizationId,
            updateDto,
          },
          { isSystemInternal: true },
          dbConnection
        );

      if (!useCaseResult.success) {
        throw new Error(useCaseResult.error);
      }

      console.log('...Profile updated');

      return useCaseResult.value;
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const deleteGithubProfile = async (
    targetOrganizationId: string
  ): Promise<any> => {
    try {
      const jwt = await getJwt();

      const configuration: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        params: new URLSearchParams({
          organizationId: targetOrganizationId,
        }),
      };

      const apiRoot = await getSelfApiRoute();

      const response = await axios.delete(
        `${apiRoot}/github/profile`,
        configuration
      );

      const jsonResponse = response.data;

      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const requestLineageCreation = async (
    base64CatalogContent: string,
    base64ManifestContent: string,
    organizationId: string
  ): Promise<any> => {
    try {
      console.log(
        `Requesting lineage creation for organization ${organizationId}`
      );

      const jwt = await getJwt();

      if (appConfig.express.mode === 'production') {
        const payload: InternalLineageInvoke = {
          internalInvokeType: 'create-lineage',
          auth: {
            jwt,
          },
          req: {
            catalog: base64CatalogContent,
            manifest: base64ManifestContent,
            targetOrganizationId: organizationId,
          },
        };

        const encoder = new TextEncoder();
        const command = new InvokeCommand({
          FunctionName:
            'arn:aws:lambda:eu-central-1:966593446935:function:lineage-service-production-app',
          Payload: encoder.encode(JSON.stringify(payload)),
        });

        const client = new LambdaClient({ region: 'eu-central-1' });

        const response = await client.send(command);

        const decoder = new TextDecoder();
        const resPayload = decoder.decode(response.Payload);

        if (/status.*:.*201/.test(resPayload)) {
          console.log(`Successfully created lineage for installation`);

          return { ...response, Payload: resPayload };
        }
        throw new Error(
          `Unexpected http status code when creating lineage: ${resPayload}`
        );
      }

      console.warn(
        `Github middleware lineage creation not in place for mode ${appConfig.express.mode} `
      );

      return undefined;
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const getBase64RepoFileContent = async (
    ownerLogin: string,
    repoName: string,
    fileName: string,
    octokit: any
  ): Promise<string> => {
    const searchPattern = `filename:${fileName}+extension:json+repo:${ownerLogin}/${repoName}`;

    const catalogRes = await octokit.request('GET /search/code', {
      q: searchPattern,
    });

    console.log(
      `Number of matches for files with name '${fileName}': ${catalogRes.data.items.length}`
    );

    let { data }: any = catalogRes;
    const { items } = data;

    const matchingItems = items.filter(
      (el: any) => el.name === `${fileName}.json`
    );

    if (!matchingItems.length) throw Error(`${fileName}.json missing`);
    if (matchingItems.length > 1) throw Error('More than 1 file found');

    const [item] = matchingItems;
    const { path } = item;

    const endpoint = 'GET /repos/{owner}/{repo}/contents/{path}';

    type ContentResponseType = Endpoints[typeof endpoint]['response'];
    const catalogResponse: ContentResponseType = await octokit.request(
      endpoint,
      {
        owner: ownerLogin,
        repo: repoName,
        path,
      }
    );

    if (catalogResponse.status !== 200) throw new Error('Reading file failed');

    // todo - include type checking
    ({ data } = catalogResponse);
    const { content, encoding } = data;

    if (typeof content !== 'string')
      throw new Error(
        'Did not receive content field in string format from API'
      );
    if (encoding !== 'base64') throw new Error('Unexpected encoding type');

    // Unclear which base64 encoding variant is used by Github. Therefore transformation to Node variant
    const utf8Content = Buffer.from(content, encoding).toString('utf8');
    return Buffer.from(utf8Content, 'utf8').toString('base64');
  };

  const handlePush = async (payload: any): Promise<void> => {
    const installationId = payload.installation.id.toString();

    const githubProfile = await getGithubProfile(
      new URLSearchParams({ installationId })
    );

    const { organizationId, firstLineageCreated } = githubProfile;

    if (firstLineageCreated) {
      console.warn(
        `Lineage creation triggered for org ${organizationId} but lineage was already created`
      );
      return;
    }

    const ownerLogin = payload.repository.owner.login;
    const repoName = payload.repository.name;

    const octokit = await githubApp.getInstallationOctokit(installationId);

    const catalogContent = await getBase64RepoFileContent(
      ownerLogin,
      repoName,
      'catalog',
      octokit
    );

    const manifestContent = await getBase64RepoFileContent(
      ownerLogin,
      repoName,
      'manifest',
      octokit
    );

    const createMetadataResult = await createMetadata.execute(
      { organizationId, installationId, manifestContent, catalogContent },
      { isSystemInternal: true },
      dbConnection
    );

    if (!createMetadataResult.success)
      throw new Error('Not able to store metadata to persistence');

    console.log('Metadata successfully stored');

    const result = await requestLineageCreation(
      catalogContent,
      manifestContent,
      organizationId
    );

    if (result)
      await updateProfile({
        installationId,
        targetOrganizationId: organizationId,
        firstLineageCreated: true,
      });
    else
      throw new Error(
        'Unclear lineage creation status. No result object available'
      );
  };

  const handleInstallationDeleted = async (payload: any): Promise<void> => {
    const installationId = payload.installation.id.toString();
    const githubProfile = await getGithubProfile(
      new URLSearchParams({ installationId })
    );

    const { organizationId } = githubProfile;

    await deleteGithubProfile(organizationId);
  };

  const handleInstallationRepoChange = async (payload: any): Promise<void> => {
    const installationId = payload.installation.id.toString();
    const githubProfile = await getGithubProfile(
      new URLSearchParams({
        installationId,
      })
    );

    const { organizationId } = githubProfile;

    const octokit = await githubApp.getInstallationOctokit(installationId);

    const endpoint = 'GET /installation/repositories';

    const reposResponse = await octokit.request(endpoint, {});

    const repos = reposResponse.data.repositories;

    const repoNames = repos.map((repo: any) => repo.full_name);

    await updateProfile({
      installationId,
      targetOrganizationId: organizationId,
      repositoryNames: repoNames,
    });
  };

  const handleEvent = async (
    id: string,
    name: string,
    payload: any
  ): Promise<void> => {
    console.log(
      `Receiving GitHub event from installation ${payload.installation.id} - id: ${id}, name: ${name}`
    );

    const event = payload.action ? `${name}.${payload.action}` : name;

    const handlingMessage = `Handling ${event} GitHub event`;

    try {
      switch (event) {
        case 'push':
          console.log(handlingMessage);
          await handlePush(payload);
          break;
        case 'installation.deleted':
          console.log(handlingMessage);
          await handleInstallationDeleted(payload);
          break;
        case 'installation_repositories.added':
          console.log(handlingMessage);
          await handleInstallationRepoChange(payload);
          break;
        case 'installation_repositories.removed':
          console.log(handlingMessage);
          await handleInstallationRepoChange(payload);
          break;
        default:
          console.warn(`Unhandled ${event} GitHub event`);
          break;
      }
    } catch (error: unknown) {
      if (typeof error === 'string')
        console.error(`Error in github-webhook-middleware: ${error}`);
      if (error instanceof Error)
        console.error(`Error in github-webhook-middleware: ${error.message}`);
      console.error('Unknown error occured in github-webhook-middleware');
    }
  };

  if (appConfig.express.mode === 'development') {
    const webhookProxyUrl = 'https://smee.io/jn9bVXprxGxZMZD';
    const source = new EventSource(webhookProxyUrl);
    source.onmessage = async (event: any) => {
      const webhookEvent = JSON.parse(event.data);
      await handleEvent(
        webhookEvent['x-github-delivery'],
        webhookEvent['x-github-event'],
        webhookEvent.body
      );
    };
  } else
    githubApp.webhooks.onAny(async ({ id, name, payload }) => {
      await handleEvent(id, name, payload);
    });

  return githubApp;
};
