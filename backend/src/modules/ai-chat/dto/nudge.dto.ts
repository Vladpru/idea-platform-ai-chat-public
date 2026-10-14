import { ApiProperty } from '@nestjs/swagger';

export class NudgeItemDto {
  @ApiProperty({ enum: ['idea', 'problem'] })
  type: 'idea' | 'problem';

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ['stale_draft', 'stage_stagnation'] })
  reason: 'stale_draft' | 'stage_stagnation';

  @ApiProperty()
  daysSinceUpdate: number;

  @ApiProperty({ nullable: true, type: String })
  stage?: string;
}

export class NudgeResponseDto {
  @ApiProperty({ type: [NudgeItemDto] })
  items: NudgeItemDto[];
}
