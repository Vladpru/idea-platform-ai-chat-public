import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { NOTIFICATION_LIST_MAX } from '../notification.constants';

export class GetNotificationsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({
    default: NOTIFICATION_LIST_MAX,
    minimum: 1,
    maximum: NOTIFICATION_LIST_MAX,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(NOTIFICATION_LIST_MAX)
  limit: number = NOTIFICATION_LIST_MAX;
}
