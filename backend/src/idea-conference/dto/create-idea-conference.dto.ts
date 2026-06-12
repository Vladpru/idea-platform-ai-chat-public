import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { IsFutureIsoDate } from './is-future-iso-date.decorator';

export class CreateIdeaConferenceDto {
  @ApiProperty({ example: 'Product roadmap Q&A' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: 'Join us for a live walkthrough of the roadmap.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    description: 'ISO 8601 datetime in the future',
    example: '2026-06-15T15:00:00.000Z',
  })
  @IsDateString({ strict: true, strictSeparator: true })
  @IsFutureIsoDate()
  scheduledFor!: string;

  @ApiPropertyOptional({
    description: 'Platform user IDs to invite as speakers',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  speakerUserIds?: string[];
}
