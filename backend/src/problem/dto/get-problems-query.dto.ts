import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  ProblemStage,
  ProblemStatus,
} from '../../../generated/prisma/client';

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
}
