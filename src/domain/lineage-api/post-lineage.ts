import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ILineageApiRepo } from './i-lineage-api-repo';
import { LineageDto } from './lineage-dto';

export interface PostLineageRequestDto {
  targetOrgId: string,
  base64CatalogContent: string,
  base64ManifestContent: string,
}

export interface PostLineageAuthDto {
  jwt: string;
}

export type PostLineageResponseDto = Result<LineageDto>;

export class PostLineage
  implements
    IUseCase<PostLineageRequestDto, PostLineageResponseDto, PostLineageAuthDto>
{
  readonly #lineageApiRepo: ILineageApiRepo;

  constructor(lineageApiRepo: ILineageApiRepo) {
    this.#lineageApiRepo = lineageApiRepo;
  }

  async execute(
    request: PostLineageRequestDto,
    auth: PostLineageAuthDto
  ): Promise<PostLineageResponseDto> {
    try {
      const postLineageResponse: LineageDto =
        await this.#lineageApiRepo.post(
          {catalog: request.base64CatalogContent, manifest: request.base64ManifestContent, targetOrgId: request.targetOrgId},
          auth.jwt
        );

      return Result.ok(postLineageResponse);
    } catch (error: unknown) {
      if(error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
