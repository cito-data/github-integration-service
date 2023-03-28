export interface SnowflakeProfileProperties {
  id: string;
  organizationId: string;
  clientId: string;
  clientSecret: string;
  accountId: string;
  cloudRegion: string;
  refreshToken: string;
  warehouseName: string;
  redirectUri: string;
}

export class SnowflakeProfile {
  #id: string;

  #organizationId: string;

  #clientId: string;

  #clientSecret: string;

  #accountId: string;

  #cloudRegion: string;

  #refreshToken: string;

  #warehouseName: string;

  #redirectUri: string;

  get id(): string {
    return this.#id;
  }

  get organizationId(): string {
    return this.#organizationId;
  }

  get clientId(): string {
    return this.#clientId;
  }

  get clientSecret(): string {
    return this.#clientSecret;
  }

  get accountId(): string {
    return this.#accountId;
  }

  get cloudRegion(): string {
    return this.#cloudRegion;
  }

  get refreshToken(): string {
    return this.#refreshToken;
  }

  get warehouseName(): string {
    return this.#warehouseName;
  }

  get redirectUri(): string {
    return this.#redirectUri;
  }

  private constructor(props: SnowflakeProfileProperties) {
    this.#id = props.id;
    this.#organizationId = props.organizationId;
    this.#clientId = props.clientId;
    this.#clientSecret = props.clientSecret;
    this.#accountId = props.accountId;
    this.#cloudRegion = props.cloudRegion;
    this.#refreshToken = props.refreshToken;
    this.#warehouseName = props.warehouseName;
    this.#redirectUri = props.redirectUri;
  }

  static create = (props: SnowflakeProfileProperties): SnowflakeProfile => {
    if (!props.id) throw new TypeError('SnowflakeProfile must have id');
    if (!props.organizationId)
      throw new TypeError('SnowflakeProfile must have organizationId');
    if (!props.clientId) throw new Error('SnowflakeProfile must have clientId');
    if (!props.clientSecret)
      throw new Error('SnowflakeProfile must have clientSecret');
    if (!props.accountId)
      throw new Error('SnowflakeProfile must have accountId');
    if (!props.cloudRegion)
      throw new Error('SnowflakeProfile must have cloudRegion');
    if (!props.refreshToken)
      throw new Error('SnowflakeProfile must have refreshToken');
    if (!props.warehouseName)
      throw new Error('SnowflakeProfile must have warehouseName');
    if (!props.redirectUri)
      throw new Error('SnowflakeProfile must have redirectUri');
    return new SnowflakeProfile(props);
  };
}
