import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ThemePreference } from '../../../generated/prisma/client';

export class UpdateThemeDto {
  @ApiProperty({ enum: ThemePreference, example: ThemePreference.SYSTEM })
  @IsEnum(ThemePreference)
  theme!: ThemePreference;
}
