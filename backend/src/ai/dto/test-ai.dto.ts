import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { APP_LIMITS } from 'src/common/config/limits';

export class TestAiDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(APP_LIMITS.MAX_AI_QUESTION_LENGTH)
  prompt!: string;
}
