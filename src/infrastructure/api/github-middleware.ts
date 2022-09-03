import { Endpoints } from '@octokit/types';
import axios, { AxiosRequestConfig } from 'axios';
import { App } from 'octokit';
import { GithubProfile } from '../../domain/entities/github-profile';
import { appConfig } from '../../config';
import getRoot from '../shared/api-root-builder';

export interface GithubConfig {
  privateKey: string;
  appId: number;
  webhookSecret: string;
  clientId: string;
  clientSecret: string;
}

export default (config: GithubConfig): App => {
  const githubApp = new App({
    appId: config.appId,
    privateKey: config.privateKey,
    webhooks: {
      secret: config.webhookSecret,
    },
    oauth: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    },
  });

  const getSelfApiRoute = async (): Promise<string> => {
    const gateway =
      appConfig.express.mode === 'production'
        ? 'wej7xjkvug.execute-api.eu-central-1.amazonaws.com/production'
        : 'localhost:3002';

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
      console.log(jsonResponse);
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const updateGithubProfile = async (
    installationId: string,
    targetOrganizationId: string,
    firstLineageCreated?: boolean,
    repositoriesToAdd?: string[],
    repositoriesToRemove?: string[]
  ): Promise<any> => {
    try {
      const jwt = await getJwt();

      const configuration: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      };

      const apiRoot = await getSelfApiRoute();

      const response = await axios.patch(
        `${apiRoot}/github/profile`,
        {
          targetOrganizationId,
          updateDto: {
            firstLineageCreated,
            repositoriesToAdd,
            repositoriesToRemove,
            installationId,
          },
        },
        configuration
      );

      const jsonResponse = response.data;
      console.log(jsonResponse);
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const deleteGithubProfile = async (
    installationId: string,
    targetOrganizationId: string
  ): Promise<any> => {
    try {
      const jwt = await getJwt();

      const configuration: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        params: {
          installationId,
          targetOrganizationId,
        },
      };

      const apiRoot = await getSelfApiRoute();

      const response = await axios.delete(
        `${apiRoot}/github/profile`,
        configuration
      );

      const jsonResponse = response.data;
      console.log(jsonResponse);
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const requestLineageCreation = async (
    catalogText: string,
    manifestText: string,
    organizationId: string
  ): Promise<any> => {
    try {
      const jwt = await getJwt();

      const configuration: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      };

      const gateway =
        appConfig.express.mode === 'production'
          ? 'kga7x5r9la.execute-api.eu-central-1.amazonaws.com/production'
          : 'localhost:3000';

      const apiRoot = await getRoot(gateway, 'api/v1');

      const response = await axios.post(
        `${apiRoot}/lineage`,
        {
          catalog: catalogText,
          manifest: manifestText,
          targetOrganizationId: organizationId,
        },
        configuration
      );

      const jsonResponse = response.data;
      console.log(jsonResponse);
      if (response.status === 200) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  const handleInstallationCreated = async (payload: any): Promise<void> => {
    const currentInstallation = payload.installation?.id;
    if (!currentInstallation) throw Error('Current installation not found');

    const githubProfile = await getGithubProfile(
      new URLSearchParams({ installationId: currentInstallation.toString(10) })
    );

    const { organizationId, firstLineageCreated } = githubProfile;

    if (firstLineageCreated) return;

    const catalogRes = await githubApp.octokit.request('GET /search/code', {
      q: `filename:catalog+extension:json+repo:${payload.repository.owner.login}/${payload.repository.name}`,
    });

    let { data }: any = catalogRes;
    let { items } = data;

    if (items.length > 1) throw Error('More than 1 catalog found');

    let [item] = items;
    let { path } = item;

    const endpoint = 'GET /repos/{owner}/{repo}/contents/{path}';

    type ContentResponseType = Endpoints[typeof endpoint]['response'];
    const catalogResponse: ContentResponseType =
      await githubApp.octokit.request(endpoint, {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        path,
      });

    if (catalogResponse.status !== 200)
      throw new Error('Reading catalog failed');

    // todo - include type checking
    ({ data } = catalogResponse);
    let { content, encoding } = data;

    if (typeof content !== 'string')
      throw new Error(
        'Did not receive content field in string format from API'
      );
    if (encoding !== 'base64') throw new Error('Unexpected encoding type');

    const catalogBuffer = Buffer.from(content, encoding);
    const catalogText = catalogBuffer.toString('utf-8');

    const manifestRes = await githubApp.octokit.request('GET /search/code', {
      q: `filename:manifest+extension:json+repo:${payload.repository.owner.login}/${payload.repository.name}`,
    });

    ({ data } = manifestRes);
    ({ items } = data);

    if (items.length > 1) throw Error('More than 1 manifest found');

    [item] = items;
    ({ path } = item);

    const manifestResponse: ContentResponseType =
      await githubApp.octokit.request(endpoint, {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        path,
      });

    if (manifestResponse.status !== 200)
      throw new Error('Reading manifest failed');

    // todo - include type checking
    ({ data } = manifestResponse);
    ({ content, encoding } = data);

    if (typeof content !== 'string')
      throw new Error(
        'Did not receive content field in string format from API'
      );
    if (encoding !== 'base64') throw new Error('Unexpected encoding type');

    const manifestBuffer = Buffer.from(content, encoding);
    const manifestText = manifestBuffer.toString('utf-8');

    const result = await requestLineageCreation(
      catalogText,
      manifestText,
      organizationId
    );

    if (result)
      await updateGithubProfile(
        currentInstallation.toString(10),
        organizationId,
        true
      );
  };

  const handleInstallationDeleted = async (payload: any): Promise<void> => {
    const currentInstallation = payload.installation.id;
    const githubProfile = await getGithubProfile(
      new URLSearchParams({ installationId: currentInstallation.toString(10) })
    );

    const { organizationId } = githubProfile;

    await deleteGithubProfile(currentInstallation.toString(10), organizationId);
  };

  const handleInstallationReposAdded = async (payload: any): Promise<void> => {
    const currentInstallation = payload.installation.id;
    const githubProfile = await getGithubProfile(
      new URLSearchParams({
        installationId: currentInstallation.toString(10),
      })
    );

    const { organizationId } = githubProfile;

    const addedRepos = payload.repositories_added;
    const addedRepoNames = addedRepos.map((repo: any) => repo.full_name);

    await updateGithubProfile(
      currentInstallation.toString(10),
      organizationId,
      undefined,
      addedRepoNames
    );
  };

  const handleInstallationReposRemoved = async (
    payload: any
  ): Promise<void> => {
    const currentInstallation = payload.installation.id;
    const githubProfile = await getGithubProfile(
      new URLSearchParams({
        installationId: currentInstallation.toString(10),
      })
    );

    const { organizationId } = githubProfile;

    const removedRepos = payload.repositories_removed;
    const removedRepoNames = removedRepos.map((repo: any) => repo.full_name);

    await updateGithubProfile(
      currentInstallation.toString(10),
      organizationId,
      undefined,
      undefined,
      removedRepoNames
    );
  };

  githubApp.webhooks.onAny(async ({ id, name, payload }) => {
    const body: any = payload;
    console.log(`Receiving GitHub event - id: ${id}, name: ${name}`);

    const event = body.action ? `${name}.${body.action}` : name;

    const handlingMessage = `Handling ${event} GitHub event`;

    try {
      switch (event) {
        case 'installation.created':
          console.log(handlingMessage);
          handleInstallationCreated(payload);
          break;
        case 'installation.deleted':
          console.log(handlingMessage);
          handleInstallationDeleted(payload);
          break;
        case 'installation_repositories.added':
          console.log(handlingMessage);
          handleInstallationReposAdded(payload);
          break;
        case 'installation_repositories.removed':
          console.log(handlingMessage);
          handleInstallationReposRemoved(payload);
          break;
        case 'push':
          console.log(handlingMessage);
          console.log('todo - Implement logic');
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
  });

  return githubApp;
};
