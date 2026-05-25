import { IsOptional, IsString, MaxLength } from 'class-validator';
import { APP_LIMITS } from 'src/common/config/limits';

export class UploadPdfSourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(APP_LIMITS.MAX_SOURCE_TITLE_LENGTH)
  title?: string;
}
