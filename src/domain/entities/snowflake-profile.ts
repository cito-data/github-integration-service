export interface SnowflakeProfileProperties {
  id: string;
  accountId: string;
  username: string;
  password: string;
  organizationId: string;
}

export class SnowflakeProfile {
  #id: string;

  #organizationId: string;

  #accountId: string; 

  #username: string; 

  #password: string; 

  get id(): string {
    return this.#id;
  }

  get organizationId(): string {
    return this.#organizationId;
  }

  get accountId(): string {
    return this.#accountId;
  }

  get username(): string {
    return this.#username;
  }

  get password(): string {
    return this.#password;
  }

  private constructor(props: SnowflakeProfileProperties) {
    this.#id = props.id;
    this.#organizationId = props.organizationId;
    this.#accountId = props.accountId;
    this.#username = props.username;
    this.#password = props.password;
  }

  static create = (props: SnowflakeProfileProperties): SnowflakeProfile => {
    if (!props.id) throw new TypeError('SnowflakeProfile must have id');
    if (!props.organizationId) throw new TypeError('SnowflakeProfile must have organizationId');
    if (!props.accountId) throw new TypeError('SnowflakeProfile must have accountId');
    if (!props.username) throw new TypeError('SnowflakeProfile must have username');
    if (!props.password) throw new TypeError('SnowflakeProfile must have password');
    

    return new SnowflakeProfile(props);
  };
}
