import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { Stage } from '../enum/stage.enum';

export class CreateIdeaDto {
  @ApiPropertyOptional({
    enum: Stage,
    example: Stage.IDEATION,
    description: 'Optional initial stage; idea is always created as DRAFT',
  })
  @IsOptional()
  @IsEnum(Stage)
  stage?: Stage;
}
