import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'sustainability' })
  name!: string;

  @ApiPropertyOptional({ example: 'Sustainability', nullable: true })
  label!: string | null;
}
