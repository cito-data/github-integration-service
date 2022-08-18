export interface GithubProfileProperties {
  id: string;
  installationId: string;
  organizationId: string;
  firstLineageCreated: boolean;
}

export class GithubProfile {

  #id: string;

  #installationId: string;

  #organizationId: string;

  #firstLineageCreated: boolean;

  get id(): string{
    return this.#id;
  }

  get installationId(): string {
    return this.#installationId;
  }
  
  get organizationId(): string {
    return this.#organizationId;
  }

  get firstLineageCreated(): boolean {
    return this.#firstLineageCreated;
  }

  private constructor(properties: GithubProfileProperties) {
    this.#id = properties.id;
    this.#installationId = properties.installationId;
    this.#organizationId = properties.organizationId;
    this.#firstLineageCreated = properties.firstLineageCreated;
  }

  static create = (properties: GithubProfileProperties): GithubProfile => {
    if (!properties.id) throw new TypeError('GithubProfile must have Id');
    if (!properties.installationId) throw new TypeError('GithubProfile must have installationId');
    if (!properties.organizationId) throw new TypeError('GithubProfile must have organizationId');
    if (!properties.firstLineageCreated) throw new TypeError('GithubProfile must have firstLineageCreated');

    return new GithubProfile(properties);
  };
}
