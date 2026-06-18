import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class ResetPasswordDto {
  @Allow()
  @ApiProperty({ example: '64-char-hex-token-from-email-link' })
  token?: string;

  @Allow()
  @ApiProperty({ example: 'newSecret123', minLength: 8 })
  newPassword?: string;
}
