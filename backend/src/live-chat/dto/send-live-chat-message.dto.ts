import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH } from '../live-chat.constants';

export class SendLiveChatMessageDto {
  @ApiProperty({
    minLength: 1,
    maxLength: LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH)
  content!: string;
}
