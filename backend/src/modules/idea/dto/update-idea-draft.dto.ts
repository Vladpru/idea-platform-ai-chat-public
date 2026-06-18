import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { IsUuid } from '../../../shared/validators/is-uuid-v7.validator';
import { Stage } from '../enum/stage.enum';

/**
 * Partial metadata update for a draft idea.
 * When problem/tag fields are sent, they replace existing links (replace semantics).
 */
export class UpdateIdeaDraftDto {
  @ApiPropertyOptional({ enum: Stage, example: Stage.IDEATION })
  @IsOptional()
  @IsEnum(Stage)
  stage?: Stage;

  @ApiPropertyOptional({
    example: 'Construction Hub: Connect, Collaborate, Build',
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
      'A platform for managing subcontractors and suppliers across construction projects.',
    minLength: 8,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(5000, { message: 'Description is too long' })
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Existing problem IDs; replaces current links when provided',
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUuid({ each: true })
  problemIds?: string[];

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
