import { Metadata } from '../entities/metadata';
import { DbConnection } from '../services/i-db';

export interface MetadataUpdateDto {
  firstLineageCreated?: boolean;
  repositoriesToAdd?: string[];
  repositoriesToRemove?: string[];
  installationId?: string;
}
export interface IMetadataRepo {
  insertOne(
    metadata: Metadata,
    dbConnection: DbConnection
  ): Promise<string>;
}
