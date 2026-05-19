import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { APP_LIMITS } from 'src/common/config/limits';

export class CreateAiAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(APP_LIMITS.MAX_AI_QUESTION_LENGTH)
  question!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(APP_LIMITS.MAX_AI_RETRIEVAL_LIMIT)
  limit?: number;
}
