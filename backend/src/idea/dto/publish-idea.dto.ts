import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Publish uses server-side IdeaPublishValidator (DB state), not request fields.
 * Body may be omitted or `{ "confirm": true }`.
 */
export class PublishIdeaDto {
  @ApiPropertyOptional({
    example: true,
    description:
      'Optional explicit confirmation; publish rules are enforced server-side',
  })
  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}
