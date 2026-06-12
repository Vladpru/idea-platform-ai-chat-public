import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const VIDEO_CALL_UPDATE_ACTIONS = ['start', 'end', 'cancel'] as const;

export type VideoCallUpdateAction = (typeof VIDEO_CALL_UPDATE_ACTIONS)[number];

export class UpdateVideoCallDto {
  @ApiProperty({ enum: VIDEO_CALL_UPDATE_ACTIONS })
  @IsIn(VIDEO_CALL_UPDATE_ACTIONS)
  action!: VideoCallUpdateAction;
}
