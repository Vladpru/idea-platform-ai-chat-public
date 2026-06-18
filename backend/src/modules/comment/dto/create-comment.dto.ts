import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { COMMENT_CONTENT_MAX_LENGTH } from '../comment.constants';

export class CreateCommentDto {
  @Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return value;
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(COMMENT_CONTENT_MAX_LENGTH)
  content?: string;

  @Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
