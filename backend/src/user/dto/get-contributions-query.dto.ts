import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export type ContributionTypeFilter = 'all' | 'idea' | 'problem';
export type ContributionTabFilter = 'authored' | 'joined';

export class GetContributionsQueryDto {
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number = 0;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take: number = 10;

  @ApiPropertyOptional({ enum: ['all', 'idea', 'problem'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'idea', 'problem'])
  type: ContributionTypeFilter = 'all';

  @ApiPropertyOptional({ enum: ['authored', 'joined'], default: 'authored' })
  @IsOptional()
  @IsIn(['authored', 'joined'])
  tab: ContributionTabFilter = 'authored';
}
