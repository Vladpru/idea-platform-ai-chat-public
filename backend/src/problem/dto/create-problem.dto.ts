import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

import { IsUuidV7 } from '../../shared/validators/is-uuid-v7.validator';
import { UpdateProblemDraftDto } from './update-problem-draft.dto';

export class CreateProblemDto extends UpdateProblemDraftDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Client-generated UUIDv7. Idempotency anchor for offline-created problems.',
  })
  @IsUuidV7()
  id!: string;

  @ApiProperty({
    example: false,
    description:
      'When false, creates a draft. When true, creates and publishes the problem (strict validation).',
  })
  @IsBoolean()
  isPublished = false;
}
