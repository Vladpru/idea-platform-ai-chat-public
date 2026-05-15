import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class ChangePasswordDto {
  @Allow()
  @ApiProperty({ example: 'currentSecret123' })
  currentPassword?: string;

  @Allow()
  @ApiProperty({ example: 'newSecret123', minLength: 8 })
  newPassword?: string;
}
