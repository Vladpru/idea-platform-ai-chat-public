import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetSuggestedSpeakersQueryDto {
  @ApiPropertyOptional({
    description:
      'Conference to resolve invite state for. Defaults to the live or next scheduled conference.',
  })
  @IsOptional()
  @IsUUID()
  conferenceId?: string;
}
