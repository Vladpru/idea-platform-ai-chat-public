import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { IsUuid } from '../../shared/validators/is-uuid-v7.validator';
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
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    example: 'Reduced downtime and improved planning accuracy.',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  valueProposition?: string;

  @ApiPropertyOptional({
    example: '1000.00',
    description: 'USD amount as a decimal string',
    maxLength: 13,
  })
  @IsOptional()
  @IsString()
  @MaxLength(13)
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'costBenefit must be a valid monetary amount',
  })
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
  @IsUuid({ each: true })
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
  @IsUuid({ each: true })
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
