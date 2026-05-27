import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  ProblemStage,
  ProblemStatus,
} from '../../../generated/prisma/client';

export type ProblemSortOption =
  | 'newest'
  | 'oldest'
  | 'most-viewed'
  | 'most-popular'
  | 'most-ideas-linked';

export const PROBLEM_SORT_OPTIONS: ProblemSortOption[] = [
  'newest',
  'oldest',
  'most-viewed',
  'most-popular',
  'most-ideas-linked',
];

export class GetProblemsQueryDto {
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

  @ApiPropertyOptional({ enum: ProblemStage })
  @IsOptional()
  @IsEnum(ProblemStage)
  stage?: ProblemStage;

  @ApiPropertyOptional({ enum: ProblemStatus })
  @IsOptional()
  @IsEnum(ProblemStatus)
  status?: ProblemStatus;

  @ApiPropertyOptional({ enum: PROBLEM_SORT_OPTIONS })
  @IsOptional()
  @IsIn(PROBLEM_SORT_OPTIONS)
  sort?: ProblemSortOption;
}
