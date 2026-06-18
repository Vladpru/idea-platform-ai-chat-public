import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const CONFERENCE_UPDATE_ACTIONS = ['start', 'end', 'cancel'] as const;

export type ConferenceUpdateAction = (typeof CONFERENCE_UPDATE_ACTIONS)[number];

export class UpdateConferenceDto {
  @ApiProperty({ enum: CONFERENCE_UPDATE_ACTIONS })
  @IsIn(CONFERENCE_UPDATE_ACTIONS)
  action!: ConferenceUpdateAction;
}
