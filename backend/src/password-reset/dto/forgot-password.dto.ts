import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class ForgotPasswordDto {
  @Allow()
  @ApiProperty({ example: 'user@example.com' })
  email?: string;
}
