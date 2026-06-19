import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { WebhookReceiver } from 'livekit-server-sdk';

import { VideoCallService } from './video-call.service';

@ApiExcludeController()
@Controller('webhooks/livekit')
export class LivekitWebhookController {
  private readonly logger = new Logger(LivekitWebhookController.name);
  private webhookReceiver: WebhookReceiver | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly videoCallService: VideoCallService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: RawBodyRequest<Request>): Promise<void> {
    const rawBody = req.rawBody;

    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Webhook body is required');
    }

    const body = rawBody.toString('utf8');
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Webhook authorization is required');
    }

    let event;

    try {
      event = await this.getWebhookReceiver().receive(body, authHeader);
    } catch (error) {
      this.logger.warn(
        `LiveKit webhook verification failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (event.event === 'room_finished' && event.room?.name) {
      await this.videoCallService.handleRoomFinished(event.room.name);
    }
  }

  private getWebhookReceiver(): WebhookReceiver {
    if (!this.webhookReceiver) {
      this.webhookReceiver = new WebhookReceiver(
        this.config.getOrThrow<string>('livekit.apiKey'),
        this.config.getOrThrow<string>('livekit.webhookSecret'),
      );
    }

    return this.webhookReceiver;
  }
}
