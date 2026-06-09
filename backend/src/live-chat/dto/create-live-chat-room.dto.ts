import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

import { EntityTarget } from '../../entity-visibility/entity-target.enum';

export class CreateLiveChatRoomDto {
  @ApiProperty({ enum: EntityTarget })
  @IsEnum(EntityTarget)
  entityType!: EntityTarget;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  entityId!: string;
}
