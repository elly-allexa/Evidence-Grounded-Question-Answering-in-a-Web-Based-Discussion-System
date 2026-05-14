import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MAX_AI_QUESTION_LENGTH, MAX_AI_RETRIEVAL_LIMIT } from 'src/config/limits'; 

export class CreateAiAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_AI_QUESTION_LENGTH)
  question!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_AI_RETRIEVAL_LIMIT)
  limit?: number;
}
