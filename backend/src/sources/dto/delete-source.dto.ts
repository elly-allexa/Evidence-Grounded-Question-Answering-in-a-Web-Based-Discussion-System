import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteSourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
