import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { VideoCallStatus } from '../../generated/prisma/client';
import { LivekitRoomService } from '../livekit/livekit-room.service';
import { LivekitTokenService } from '../livekit/livekit-token.service';
import { RealtimePublisherService } from '../realtime/realtime-publisher.service';
import { REALTIME_NAMESPACES } from '../realtime/realtime.types';
import { isUniqueConstraintError } from '../shared/utils/is-unique-error.util';
import type { VideoCallUpdateAction } from './dto/update-video-call.dto';
import { liveChatRoomName } from './live-chat.constants';
import { formatAuthorDisplayName } from './live-chat.mapper';
import type { LiveChatAuthorRecord } from './live-chat.records';
import { LiveChatService } from './live-chat.service';
import type {
  JoinVideoCallResponse,
  VideoCallDto,
  VideoCallLifecyclePayload,
  VideoCallListResponse,
} from './types/video-call.types';
import {
  VIDEO_CALL_ALREADY_ACTIVE,
  VIDEO_CALL_EMPTY_TIMEOUT_SECONDS,
  VIDEO_CALL_HOST_ONLY,
  VIDEO_CALL_NOT_ACTIVE,
  VIDEO_CALL_NOT_FOUND,
  VIDEO_CALL_NOT_SCHEDULED,
  VIDEO_CALL_SCHEDULED_FOR_PAST,
  VIDEO_CALL_TOKEN_TTL_SECONDS,
} from './video-call.constants';
import {
  buildProviderRoomName,
  toVideoCallResponse,
} from './video-call.mapper';
import { VideoCallRepository } from './video-call.repository';

@Injectable()
export class VideoCallService {
  constructor(
    private readonly videoCallRepository: VideoCallRepository,
    private readonly liveChatService: LiveChatService,
    private readonly realtimePublisher: RealtimePublisherService,
    private readonly livekitTokenService: LivekitTokenService,
    private readonly livekitRoomService: LivekitRoomService,
  ) {}

  private publishRoomEvent(
    roomId: string,
    event: string,
    payload: VideoCallDto | VideoCallLifecyclePayload,
  ): void {
    this.realtimePublisher.publish(
      {
        namespace: REALTIME_NAMESPACES.LIVE_CHAT,
        room: liveChatRoomName(roomId),
      },
      event,
      payload,
    );
  }

  async listCalls(
    roomId: string,
    userId: string,
  ): Promise<VideoCallListResponse> {
    await this.liveChatService.assertRoomAccess(roomId, userId);

    const now = new Date();
    const [activeCall, upcomingCalls] = await Promise.all([
      this.videoCallRepository.findActiveCall(roomId),
      this.videoCallRepository.findUpcomingCalls(roomId, now),
    ]);

    return {
      activeCall: activeCall ? toVideoCallResponse(activeCall) : null,
      upcomingCalls: upcomingCalls.map(toVideoCallResponse),
    };
  }

  async createCall(
    roomId: string,
    userId: string,
    scheduledFor?: string,
  ): Promise<VideoCallDto> {
    await this.liveChatService.assertRoomAccess(roomId, userId);

    if (scheduledFor) {
      return this.createScheduledCall(roomId, userId, scheduledFor);
    }

    return this.createAdHocCall(roomId, userId);
  }

  async updateCall(
    roomId: string,
    callId: string,
    userId: string,
    action: VideoCallUpdateAction,
  ): Promise<VideoCallDto> {
    await this.liveChatService.assertRoomAccess(roomId, userId);

    const call = await this.videoCallRepository.findVideoCallById(
      callId,
      roomId,
    );

    if (!call) {
      throw new NotFoundException(VIDEO_CALL_NOT_FOUND);
    }

    switch (action) {
      case 'start':
        return this.startScheduledCall(roomId, call);
      case 'end':
        return this.endCall(call, userId);
      case 'cancel':
        return this.cancelCall(call, userId);
      default:
        throw new BadRequestException('Invalid video call action');
    }
  }

  async joinCall(
    roomId: string,
    callId: string,
    userId: string,
  ): Promise<JoinVideoCallResponse> {
    await this.liveChatService.assertRoomAccess(roomId, userId);

    const call = await this.videoCallRepository.findVideoCallById(
      callId,
      roomId,
    );

    if (!call) {
      throw new NotFoundException(VIDEO_CALL_NOT_FOUND);
    }

    if (call.status !== VideoCallStatus.ACTIVE) {
      throw new BadRequestException(VIDEO_CALL_NOT_ACTIVE);
    }

    if (!call.providerRoomName) {
      throw new BadRequestException(VIDEO_CALL_NOT_ACTIVE);
    }

    const participant = await this.videoCallRepository.findUserAuthor(userId);

    if (!participant) {
      throw new NotFoundException(VIDEO_CALL_NOT_FOUND);
    }

    const token = await this.mintAccessToken(
      userId,
      participant,
      call.providerRoomName,
    );

    return {
      token,
      livekitUrl: this.livekitTokenService.getLivekitUrl(),
      call: toVideoCallResponse(call),
    };
  }

  async handleRoomFinished(providerRoomName: string): Promise<void> {
    const call =
      await this.videoCallRepository.findVideoCallByProviderRoomName(
        providerRoomName,
      );

    if (!call || call.status !== VideoCallStatus.ACTIVE) {
      return;
    }

    const updatedCall = await this.videoCallRepository.updateVideoCall(
      call.id,
      {
        status: VideoCallStatus.ENDED,
        endedAt: new Date(),
      },
    );

    this.publishRoomEvent(updatedCall.roomId, 'call_ended', {
      callId: updatedCall.id,
      roomId: updatedCall.roomId,
    });
  }

  private async createScheduledCall(
    roomId: string,
    userId: string,
    scheduledFor: string,
  ): Promise<VideoCallDto> {
    const scheduledDate = new Date(scheduledFor);

    if (Number.isNaN(scheduledDate.getTime())) {
      throw new BadRequestException(VIDEO_CALL_SCHEDULED_FOR_PAST);
    }

    if (scheduledDate.getTime() <= Date.now()) {
      throw new BadRequestException(VIDEO_CALL_SCHEDULED_FOR_PAST);
    }

    const call = await this.videoCallRepository.createVideoCall({
      roomId,
      hostId: userId,
      status: VideoCallStatus.SCHEDULED,
      scheduledFor: scheduledDate,
    });

    const response = toVideoCallResponse(call);
    this.publishRoomEvent(roomId, 'call_scheduled', response);
    return response;
  }

  private async createAdHocCall(
    roomId: string,
    userId: string,
  ): Promise<VideoCallDto> {
    const existingActive =
      await this.videoCallRepository.findActiveCall(roomId);

    if (existingActive) {
      throw new ConflictException(VIDEO_CALL_ALREADY_ACTIVE);
    }

    const startedAt = new Date();

    let call: Awaited<ReturnType<VideoCallRepository['createVideoCall']>>;

    try {
      call = await this.videoCallRepository.createVideoCall({
        roomId,
        hostId: userId,
        status: VideoCallStatus.ACTIVE,
        startedAt,
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      throw new ConflictException(VIDEO_CALL_ALREADY_ACTIVE);
    }

    const providerRoomName = buildProviderRoomName(call.id);

    try {
      await this.livekitRoomService.createRoom(
        providerRoomName,
        VIDEO_CALL_EMPTY_TIMEOUT_SECONDS,
      );

      call = await this.videoCallRepository.updateVideoCall(call.id, {
        providerRoomName,
      });
    } catch (error) {
      await this.videoCallRepository
        .updateVideoCall(call.id, {
          status: VideoCallStatus.ENDED,
          endedAt: new Date(),
        })
        .catch(() => undefined);

      throw error;
    }

    const response = toVideoCallResponse(call);
    this.publishRoomEvent(roomId, 'call_started', response);
    return response;
  }

  private async startScheduledCall(
    roomId: string,
    call: Awaited<ReturnType<VideoCallRepository['findVideoCallById']>>,
  ): Promise<VideoCallDto> {
    if (!call) {
      throw new NotFoundException(VIDEO_CALL_NOT_FOUND);
    }

    if (call.status !== VideoCallStatus.SCHEDULED) {
      throw new BadRequestException(VIDEO_CALL_NOT_SCHEDULED);
    }

    const existingActive =
      await this.videoCallRepository.findActiveCall(roomId);

    if (existingActive && existingActive.id !== call.id) {
      throw new ConflictException(VIDEO_CALL_ALREADY_ACTIVE);
    }

    const startedAt = new Date();
    const providerRoomName = buildProviderRoomName(call.id);

    let updatedCall: Awaited<
      ReturnType<VideoCallRepository['updateVideoCall']>
    >;

    try {
      updatedCall = await this.videoCallRepository.updateVideoCall(call.id, {
        status: VideoCallStatus.ACTIVE,
        startedAt,
        providerRoomName,
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      throw new ConflictException(VIDEO_CALL_ALREADY_ACTIVE);
    }

    try {
      await this.livekitRoomService.createRoom(
        providerRoomName,
        VIDEO_CALL_EMPTY_TIMEOUT_SECONDS,
      );
    } catch (error) {
      await this.videoCallRepository
        .updateVideoCall(call.id, {
          status: VideoCallStatus.SCHEDULED,
          startedAt: null,
          providerRoomName: null,
        })
        .catch(() => undefined);

      throw error;
    }

    const response = toVideoCallResponse(updatedCall);
    this.publishRoomEvent(roomId, 'call_started', response);
    return response;
  }

  private async endCall(
    call: NonNullable<
      Awaited<ReturnType<VideoCallRepository['findVideoCallById']>>
    >,
    userId: string,
  ): Promise<VideoCallDto> {
    this.assertHost(call, userId);

    if (call.status !== VideoCallStatus.ACTIVE) {
      throw new BadRequestException(VIDEO_CALL_NOT_ACTIVE);
    }

    if (call.providerRoomName) {
      await this.livekitRoomService
        .deleteRoom(call.providerRoomName)
        .catch(() => undefined);
    }

    const updatedCall = await this.videoCallRepository.updateVideoCall(
      call.id,
      {
        status: VideoCallStatus.ENDED,
        endedAt: new Date(),
      },
    );

    const response = toVideoCallResponse(updatedCall);
    this.publishRoomEvent(updatedCall.roomId, 'call_ended', {
      callId: updatedCall.id,
      roomId: updatedCall.roomId,
    });
    return response;
  }

  private async cancelCall(
    call: NonNullable<
      Awaited<ReturnType<VideoCallRepository['findVideoCallById']>>
    >,
    userId: string,
  ): Promise<VideoCallDto> {
    this.assertHost(call, userId);

    if (call.status !== VideoCallStatus.SCHEDULED) {
      throw new BadRequestException(VIDEO_CALL_NOT_SCHEDULED);
    }

    const updatedCall = await this.videoCallRepository.updateVideoCall(
      call.id,
      {
        status: VideoCallStatus.CANCELLED,
        endedAt: new Date(),
      },
    );

    const response = toVideoCallResponse(updatedCall);
    this.publishRoomEvent(updatedCall.roomId, 'call_cancelled', {
      callId: updatedCall.id,
      roomId: updatedCall.roomId,
    });
    return response;
  }

  private assertHost(
    call: NonNullable<
      Awaited<ReturnType<VideoCallRepository['findVideoCallById']>>
    >,
    userId: string,
  ): void {
    if (call.hostId !== userId) {
      throw new ForbiddenException(VIDEO_CALL_HOST_ONLY);
    }
  }

  private async mintAccessToken(
    userId: string,
    participant: LiveChatAuthorRecord,
    providerRoomName: string,
  ): Promise<string> {
    return this.livekitTokenService.mintRoomToken({
      identity: userId,
      name: formatAuthorDisplayName(participant),
      providerRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      ttlSeconds: VIDEO_CALL_TOKEN_TTL_SECONDS,
    });
  }
}
