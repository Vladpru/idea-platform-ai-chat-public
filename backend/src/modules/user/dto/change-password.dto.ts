import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { PASSWORD_MAX_LENGTH } from '../../../shared/utils/validate-password.util';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Current password must be at most ${PASSWORD_MAX_LENGTH} characters`,
  })
  @ApiProperty({ example: 'currentSecret123', maxLength: PASSWORD_MAX_LENGTH })
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `New password must be at most ${PASSWORD_MAX_LENGTH} characters`,
  })
  @ApiProperty({
    example: 'newSecret123!',
    minLength: 8,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  newPassword!: string;
}
