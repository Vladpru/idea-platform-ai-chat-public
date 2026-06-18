import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class CreateVideoCallDto {
  @ApiPropertyOptional({
    description:
      'ISO 8601 datetime for a scheduled call. Omit to start immediately.',
    example: '2026-06-15T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
