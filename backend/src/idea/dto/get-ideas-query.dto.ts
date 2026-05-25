import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { IdeaStatus } from '../../../generated/prisma/client';
import { Stage } from '../enum/stage.enum';

export type IdeaSortOption =
  | 'newest'
  | 'oldest'
  | 'views'
  | 'likes'
  | 'comments';

export const IDEA_SORT_OPTIONS: IdeaSortOption[] = [
  'newest',
  'oldest',
  'views',
  'likes',
  'comments',
];

export class GetIdeasQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;

  @ApiPropertyOptional({ enum: Stage })
  @IsOptional()
  @IsEnum(Stage)
  stage?: Stage;

  @ApiPropertyOptional({ enum: IdeaStatus })
  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;

  @ApiPropertyOptional({ enum: IDEA_SORT_OPTIONS })
  @IsOptional()
  @IsIn(IDEA_SORT_OPTIONS)
  sort?: IdeaSortOption;
}
