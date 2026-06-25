import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { AiChatService } from './ai-chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import type { ChatResponseDto } from './dto/chat-response.dto';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('ai-chat')
@JwtAuth()
@Controller('ai/chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Send a message to the AI assistant' })
  @ApiOkResponse({
    description: 'AI answer with sources and conversation history',
  })
  sendMessage(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChatMessageDto,
  ): Promise<ChatResponseDto> {
    return this.aiChatService.sendMessage(req.user.id, dto.message);
  }
}
