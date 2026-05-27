import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class GlobalSearchQueryDto {
  @ApiProperty({ description: 'Search query', minLength: 3, maxLength: 200 })
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(3)
  @MaxLength(200)
  q: string;

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

  @ApiPropertyOptional({ enum: ['ideas', 'problems'], default: 'ideas' })
  @IsString()
  @IsIn(['ideas', 'problems'])
  activeTab: 'ideas' | 'problems' = 'ideas';
}
