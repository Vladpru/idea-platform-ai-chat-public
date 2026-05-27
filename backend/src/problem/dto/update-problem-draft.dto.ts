import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ProblemStage } from '../enum/problem-stage.enum';

export class UpdateProblemDraftDto {
  @ApiPropertyOptional({ enum: ProblemStage, example: ProblemStage.ACTIVE })
  @IsOptional()
  @IsEnum(ProblemStage)
  stage?: ProblemStage;

  @ApiPropertyOptional({
    example: 'Low visibility into equipment usage',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example:
      'Teams lack real-time insight into how assets are used across sites.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Reduced downtime and improved planning accuracy.',
  })
  @IsOptional()
  @IsString()
  valueProposition?: string;

  @ApiPropertyOptional({
    example: '1000.00',
    description: 'USD amount as a decimal string (commas allowed)',
  })
  @IsOptional()
  @IsString()
  costBenefit?: string;

  @ApiPropertyOptional({ example: 'Operations' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'High operational cost' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  impact?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Existing idea IDs; replaces current links when provided',
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  ideaIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Existing tag IDs; replaces current links when provided',
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Tag labels; replaces current links when provided',
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tagLabels?: string[];
}
