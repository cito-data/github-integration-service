import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';
import { Metadata } from '../entities/metadata';
import { IMetadataRepo } from './i-metadata-repo';

export interface CreateMetadataRequestDto {
  installationId: string;
  organizationId: string;
  catalogContent: string;
  manifestContent: string;
}

export interface CreateMetadataAuthDto {
  isSystemInternal: boolean;
}

export type CreateMetadataResponseDto = Result<{ id: string }>;

export class CreateMetadata
  implements
    IUseCase<
      CreateMetadataRequestDto,
      CreateMetadataResponseDto,
      CreateMetadataAuthDto,
      DbConnection
    >
{
  readonly #metadataRepo: IMetadataRepo;

  #dbConnection: DbConnection;

  constructor(metadataRepo: IMetadataRepo) {
    this.#metadataRepo = metadataRepo;
  }

  async execute(
    request: CreateMetadataRequestDto,
    auth: CreateMetadataAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateMetadataResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const metadata = Metadata.create({
        id: new ObjectId().toHexString(),
        installationId: request.installationId,
        organizationId: request.organizationId,
        catalogContent: request.catalogContent,
        manifestContent: request.manifestContent,
      });

      await this.#metadataRepo.insertOne(metadata, this.#dbConnection);

      return Result.ok({ id: metadata.id });
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
