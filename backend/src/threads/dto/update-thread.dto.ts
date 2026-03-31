import { IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateThreadDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content?: string;
}
