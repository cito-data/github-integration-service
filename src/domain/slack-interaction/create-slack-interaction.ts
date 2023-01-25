import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { DbConnection } from '../services/i-db';

export interface CreateSlackInteractionRequestDto {
  user: string;
}

export type CreateSlackInteractionAuthDto = null;

export type CreateSlackInteractionResponseDto = Result<null>;

export class CreateSlackInteraction
  implements
    IUseCase<
      CreateSlackInteractionRequestDto,
      CreateSlackInteractionResponseDto,
      CreateSlackInteractionAuthDto
    >
{
  #dbConnection: DbConnection;

  async execute(
    req: CreateSlackInteractionRequestDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    auth: CreateSlackInteractionAuthDto
  ): Promise<CreateSlackInteractionResponseDto> {
    try {
      console.log(`User ${req.user} provided feedback to a given alert`);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
