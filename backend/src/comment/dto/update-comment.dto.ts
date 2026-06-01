import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  COMMENT_CONTENT_MAX_LENGTH,
  MAX_COMMENT_ATTACHMENTS,
} from '../comment.constants';

function normalizeUuidArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const items = Array.isArray(value) ? value : [value];
  const normalized = items
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}

export class UpdateCommentDto {
  @ApiProperty({ maxLength: COMMENT_CONTENT_MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : '',
  )
  @IsString()
  @MaxLength(COMMENT_CONTENT_MAX_LENGTH)
  content!: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs of existing attachments to remove',
    maxItems: MAX_COMMENT_ATTACHMENTS,
  })
  @Transform(({ value }: { value: unknown }) => normalizeUuidArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_COMMENT_ATTACHMENTS)
  @IsUUID('4', { each: true })
  deletedAttachmentIds?: string[];
}
