import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateProblemDraftDto {
  @ApiPropertyOptional({ example: 'Low visibility into equipment usage' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example:
      'Teams lack real-time insight into how assets are used across sites.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
