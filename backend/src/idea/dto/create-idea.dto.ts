import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

import { IsUuidV7 } from '../../shared/validators/is-uuid-v7.validator';
import { UpdateIdeaDraftDto } from './update-idea-draft.dto';

export class CreateIdeaDto extends UpdateIdeaDraftDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Client-generated UUIDv7. Idempotency anchor for offline-created ideas.',
  })
  @IsUuidV7()
  id!: string;

  @ApiProperty({
    example: false,
    description:
      'When false, creates a draft. When true, creates and publishes the idea (strict validation).',
  })
  @IsBoolean()
  isPublished: boolean;
}
