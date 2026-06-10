import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

import {
  ENTITY_LINK_TARGETS,
  EntityTarget,
} from '../../entity-visibility/entity-target.enum';

export class CreateLiveChatRoomDto {
  @ApiProperty({ enum: ENTITY_LINK_TARGETS })
  @IsIn(ENTITY_LINK_TARGETS)
  entityType!: EntityTarget.IDEA | EntityTarget.PROBLEM;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  entityId!: string;
}
