import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

import { LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH } from '../live-chat.constants';

export class SendLiveChatMessageDto {
  @ApiProperty({
    maxLength: LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH,
  })
  @IsString()
  @MaxLength(LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH)
  content!: string;
}
