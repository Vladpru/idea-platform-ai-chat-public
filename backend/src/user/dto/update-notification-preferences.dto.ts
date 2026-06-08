import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

function nullToUndefined(value: unknown): unknown {
  return value === null ? undefined : value;
}

class NotificationChannelPreferencesDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => nullToUndefined(value))
  inApp?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => nullToUndefined(value))
  email?: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  newSimilarIdeas?: NotificationChannelPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  newSimilarProblems?: NotificationChannelPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  statusChange?: NotificationChannelPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  newSupporters?: NotificationChannelPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  newComments?: NotificationChannelPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  assignedIdeasAndProblems?: NotificationChannelPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  followUps?: NotificationChannelPreferencesDto;
}
