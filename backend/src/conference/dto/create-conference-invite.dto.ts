import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsUUID, ValidateIf } from 'class-validator';

export class CreateConferenceInviteDto {
  @ApiPropertyOptional({ description: 'Platform user to invite as a speaker' })
  @ValidateIf((dto: CreateConferenceInviteDto) => dto.email === undefined)
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'External email address to invite as a speaker',
  })
  @ValidateIf((dto: CreateConferenceInviteDto) => dto.userId === undefined)
  @IsEmail()
  email?: string;
}
