export interface SlackProfileProperties {
  id:string;
  channelId: string;
  workspaceId: string;
  accessToken: string;
  organizationId: string;
}

export class SlackProfile {

  #id: string;

  #channelId: string;

  #workspaceId: string;
  
  #accessToken: string;

  #organizationId: string;

  get id(): string{
    return this.#id;
  }

  get channelId(): string {
    return this.#channelId;
  }

  get workspaceId(): string {
    return this.#workspaceId;
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
    this.#workspaceId = props.workspaceId;
    this.#accessToken = props.accessToken;
    this.#organizationId = props.organizationId;
  }

  static create = (props: SlackProfileProperties): SlackProfile => {
    if (!props.id) throw new TypeError('SlackProfile must have Id');
    if (!props.channelId) throw new TypeError('SlackProfile must have Channel Id');
    if (!props.workspaceId) throw new TypeError('SlackProfile must have Workspace Id');
    if (!props.accessToken) throw new TypeError('SlackProfile must have Token');
    if (!props.organizationId) throw new TypeError('SnowflakeProfile must have organizationId');

    return new SlackProfile(props);
  };
}
