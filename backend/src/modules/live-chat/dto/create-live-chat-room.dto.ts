import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import {
  ENTITY_LINK_TARGETS,
  EntityTarget,
} from '../../entity-visibility/entity-target.enum';
import { IsUuid } from '../../../shared/validators/is-uuid-v7.validator';

export class CreateLiveChatRoomDto {
  @ApiProperty({ enum: ENTITY_LINK_TARGETS })
  @IsIn(ENTITY_LINK_TARGETS)
  entityType!: EntityTarget.IDEA | EntityTarget.PROBLEM;

  @ApiProperty({ format: 'uuid' })
  @IsUuid()
  entityId!: string;
}
