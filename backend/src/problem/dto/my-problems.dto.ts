import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min } from 'class-validator';

export class MyProblemsQueryDto {
  @ApiPropertyOptional({ enum: ['published', 'drafts'], default: 'published' })
  @IsIn(['published', 'drafts', 'joined'])
  tab: 'published' | 'drafts' | 'joined' = 'published';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
