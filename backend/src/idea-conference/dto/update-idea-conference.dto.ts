import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const IDEA_CONFERENCE_UPDATE_ACTIONS = [
  'start',
  'end',
  'cancel',
] as const;

export type IdeaConferenceUpdateAction =
  (typeof IDEA_CONFERENCE_UPDATE_ACTIONS)[number];

export class UpdateIdeaConferenceDto {
  @ApiProperty({ enum: IDEA_CONFERENCE_UPDATE_ACTIONS })
  @IsIn(IDEA_CONFERENCE_UPDATE_ACTIONS)
  action!: IdeaConferenceUpdateAction;
}
