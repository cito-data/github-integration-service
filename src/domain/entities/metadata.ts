export interface MetadataProperties {
  id: string;
  organizationId: string;
  installationId: string;
  manifestContent: string;
  catalogContent: string;
}

export class Metadata {

  #id: string;

  #organizationId: string;

  #installationId: string;

  #manifestContent: string;
  
  #catalogContent: string;

  #createdOn: string;

  get id(): string{
    return this.#id;
  }

  get installationId(): string {
    return this.#installationId;
  }
  
  get organizationId(): string {
    return this.#organizationId;
  }

  get manifestContent(): string {
    return this.#manifestContent;
  }

  get catalogContent(): string {
    return this.#catalogContent;
  }

  get createdOn(): string {
    return this.#createdOn;
  }

  private constructor(properties: MetadataProperties) {
    this.#id = properties.id;
    this.#installationId = properties.installationId;
    this.#organizationId = properties.organizationId;
    this.#manifestContent = properties.manifestContent;
    this.#catalogContent = properties.catalogContent;
    this.#createdOn = new Date().toISOString();
  }

  static create = (properties: MetadataProperties): Metadata => {
    if (!properties.id) throw new TypeError('Metadata must have Id');
    if (!properties.installationId) throw new TypeError('Metadata must have installationId');
    if (!properties.organizationId) throw new TypeError('Metadata must have organizationId');
    if (!properties.manifestContent) throw new TypeError('Metadata must have manifestContent');
    if (!properties.catalogContent) throw new TypeError('Metadata must have catalogContent');

    return new Metadata(properties);
  };
}
