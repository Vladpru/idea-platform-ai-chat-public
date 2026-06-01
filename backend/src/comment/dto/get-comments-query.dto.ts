import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const COMMENT_SORT_VALUES = ['newest', 'oldest'] as const;
export type CommentSort = (typeof COMMENT_SORT_VALUES)[number];

export class GetCommentsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;

  @ApiPropertyOptional({ enum: COMMENT_SORT_VALUES, default: 'newest' })
  @IsOptional()
  @IsIn(COMMENT_SORT_VALUES)
  sort?: CommentSort;
}
