import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { IsUuid } from '../../shared/validators/is-uuid-v7.validator';

export class SuggestedIdeasQueryDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated tag labels',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Idea IDs already linked (excluded from suggestions)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter(
        (entry): entry is string => typeof entry === 'string',
      );
    }
    return String(value)
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean);
  })
  @IsUuid({ each: true })
  exclude?: string[] = [];

  @ApiPropertyOptional({ default: 6, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number = 6;
}
