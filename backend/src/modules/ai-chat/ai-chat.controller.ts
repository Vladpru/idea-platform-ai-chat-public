import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { AiChatService } from './ai-chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import type {
  ChatMessageResponseDto,
  ChatSessionDto,
} from './dto/chat-session.dto';
import { KbStatsDto } from './dto/kb-stats.dto';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('ai-chat')
@JwtAuth()
@Controller('ai/chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get('kb-stats')
  @ApiOperation({ summary: 'Get real-time knowledge base statistics' })
  @ApiOkResponse({ type: KbStatsDto })
  getKbStats(): Promise<KbStatsDto> {
    return this.aiChatService.getKbStats();
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List all chat sessions for the current user' })
  listSessions(@Req() req: AuthenticatedRequest): Promise<ChatSessionDto[]> {
    return this.aiChatService.listSessions(req.user.id);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chat session' })
  createSession(@Req() req: AuthenticatedRequest): Promise<ChatSessionDto> {
    return this.aiChatService.createSession(req.user.id);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat session and all its messages' })
  deleteSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
  ): Promise<void> {
    return this.aiChatService.deleteSession(req.user.id, sessionId);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'Get all messages for a session' })
  getSessionMessages(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
  ): Promise<ChatMessageResponseDto[]> {
    return this.aiChatService.getSessionMessages(req.user.id, sessionId);
  }

  @Post('sessions/:id/stream')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Send a message and receive a streaming AI response',
  })
  @ApiOkResponse({ description: 'Server-sent events stream' })
  async streamMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
    @Body() dto: ChatMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    await this.aiChatService.streamMessage(
      req.user.id,
      sessionId,
      dto.message,
      res,
    );
  }
}
