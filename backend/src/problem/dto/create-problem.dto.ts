import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

import { UpdateProblemDraftDto } from './update-problem-draft.dto';

export class CreateProblemDto extends UpdateProblemDraftDto {
  @ApiProperty({
    example: false,
    description:
      'When false, creates a draft. When true, creates and publishes the problem (strict validation).',
  })
  @IsBoolean()
  isPublished = false;
}
