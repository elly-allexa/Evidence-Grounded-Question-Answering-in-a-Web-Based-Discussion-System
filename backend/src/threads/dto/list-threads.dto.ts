import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { APP_LIMITS } from 'src/common/config/limits';

export const THREAD_SORT_VALUES = ['newest', 'popular', 'active'] as const;

export type ThreadSort = (typeof THREAD_SORT_VALUES)[number];

export class ListThreadsDto {
  @IsOptional()
  @IsString()
  @MaxLength(APP_LIMITS.MAX_THREAD_SEARCH_LENGTH)
  search?: string;

  @IsOptional()
  @IsIn(THREAD_SORT_VALUES)
  sort?: ThreadSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(APP_LIMITS.MAX_THREAD_PAGE_SIZE)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mine?: boolean;
}
