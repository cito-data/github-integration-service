export interface SlackProfileProperties {
  id:string;
  channelId: string;
  channelName: string;
  accessToken: string;
  organizationId: string;
}

export class SlackProfile {

  #id: string;

  #channelId: string;

  #channelName: string;

  #accessToken: string;

  #organizationId: string;

  get id(): string{
    return this.#id;
  }

  get channelId(): string {
    return this.#channelId;
  }

  get channelName(): string {
    return this.#channelName;
  }

  get accessToken(): string {
    return this.#accessToken;
  }
  
  get organizationId():string{
    return this.#organizationId;
  }

  private constructor(props: SlackProfileProperties) {
    this.#id = props.id;
    this.#channelId = props.channelId;
    this.#channelName = props.channelName;
    this.#accessToken = props.accessToken;
    this.#organizationId = props.organizationId;
  }

  static create = (props: SlackProfileProperties): SlackProfile => {
    if (!props.id) throw new TypeError('SlackProfile must have Id');
    if (!props.channelId) throw new TypeError('SlackProfile must have Channel Id');
    if (!props.channelName) throw new TypeError('SlackProfile must have Channel name');
    if (!props.accessToken) throw new TypeError('SlackProfile must have Token');
    if (!props.organizationId) throw new TypeError('SnowflakeProfile must have organizationId');

    return new SlackProfile(props);
  };
}
