import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SuggestTagsQueryDto {
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
    type: [String],
    description: 'Tag names already added (excluded from suggestions)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .filter((entry): entry is string => typeof entry === 'string')
        .map(entry => entry.trim())
        .filter(Boolean);
    }
    if (typeof value !== 'string') return [];
    return value
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean);
  })
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  exclude?: string[] = [];

  @ApiPropertyOptional({ default: 6, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number = 6;

  @ApiPropertyOptional({ enum: ['idea', 'problem'] })
  @IsOptional()
  @IsIn(['idea', 'problem'])
  context?: 'idea' | 'problem';
}
