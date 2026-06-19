import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
} from 'class-validator';

import { IsUuidV7 } from '../../../shared/validators/is-uuid-v7.validator';
import { LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH } from '../live-chat.constants';

export class SendLiveChatMessageDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Client-generated UUIDv7 dedup key for offline-queued messages.',
  })
  @IsUuidV7()
  clientMessageId!: string;

  @ApiProperty({
    minLength: 1,
    maxLength: LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH,
  })
  @IsString()
  @MaxLength(LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH)
  content!: string;
}

export class SendLiveChatMessagePayloadDto extends SendLiveChatMessageDto {
  @IsUUID()
  roomId!: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  attachmentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  attachmentMimeType?: string;
}
