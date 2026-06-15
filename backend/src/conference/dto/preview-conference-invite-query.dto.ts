import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class PreviewConferenceInviteQueryDto {
  @ApiProperty({
    description: 'External conference invite token',
    example: '550e8400-e29b-41d4-a716-446655440000.abc123',
  })
  @IsString()
  @MinLength(1)
  token!: string;
}
