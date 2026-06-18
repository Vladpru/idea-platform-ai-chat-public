import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';

import { IsUuid } from '../../../shared/validators/is-uuid-v7.validator';
import { SourceXorTextConstraint } from '../validators/source-xor-text.constraint';

export class SimilarityQueryDto {
  @ApiProperty({ enum: ['idea', 'problem'] })
  @IsString()
  @IsIn(['idea', 'problem'])
  entityType: 'idea' | 'problem';

  @ApiPropertyOptional({ default: 3, minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit: number = 3;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUuid()
  @Validate(SourceXorTextConstraint)
  sourceId?: string;

  @ApiPropertyOptional({ minLength: 10, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(10)
  @MaxLength(5000)
  text?: string;
}
