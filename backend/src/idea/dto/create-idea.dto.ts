import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

import { UpdateIdeaDraftDto } from './update-idea-draft.dto';

export class CreateIdeaDto extends UpdateIdeaDraftDto {
  @ApiProperty({
    example: false,
    description:
      'When false, creates a draft. When true, creates and publishes the idea (strict validation).',
  })
  @IsBoolean()
  isPublished: boolean;
}
