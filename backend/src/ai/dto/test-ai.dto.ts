import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TestAiDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt!: string;
}
