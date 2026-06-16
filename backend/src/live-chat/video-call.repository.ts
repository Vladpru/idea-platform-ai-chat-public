import { Injectable } from '@nestjs/common';
import { VideoCallStatus } from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { LIVE_CHAT_AUTHOR_SELECT } from './live-chat.constants';
import type { LiveChatAuthorRecord } from './live-chat.records';
import { videoCallInclude } from './video-call.constants';
import type { VideoCallRecord } from './video-call.records';

@Injectable()
export class VideoCallRepository {
  constructor(private readonly prisma: PrismaService) {}

  createVideoCall(data: {
    roomId: string;
    hostId: string;
    status: VideoCallStatus;
    scheduledFor?: Date | null;
    startedAt?: Date | null;
    providerRoomName?: string | null;
  }): Promise<VideoCallRecord> {
    return this.prisma.videoCall.create({
      data,
      include: videoCallInclude,
    });
  }

  findVideoCallById(
    callId: string,
    roomId: string,
  ): Promise<VideoCallRecord | null> {
    return this.prisma.videoCall.findFirst({
      where: { id: callId, roomId },
      include: videoCallInclude,
    });
  }

  findActiveCall(roomId: string): Promise<VideoCallRecord | null> {
    return this.prisma.videoCall.findFirst({
      where: { roomId, status: VideoCallStatus.ACTIVE },
      include: videoCallInclude,
    });
  }

  findActiveCallsByRoomIds(roomIds: string[]): Promise<VideoCallRecord[]> {
    if (roomIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.videoCall.findMany({
      where: {
        roomId: { in: roomIds },
        status: VideoCallStatus.ACTIVE,
      },
      include: videoCallInclude,
    });
  }

  findVideoCallByProviderRoomName(
    providerRoomName: string,
  ): Promise<VideoCallRecord | null> {
    return this.prisma.videoCall.findFirst({
      where: { providerRoomName },
      include: videoCallInclude,
    });
  }

  findUpcomingCalls(roomId: string, now: Date): Promise<VideoCallRecord[]> {
    return this.prisma.videoCall.findMany({
      where: {
        roomId,
        status: VideoCallStatus.SCHEDULED,
        scheduledFor: { gte: now },
      },
      orderBy: { scheduledFor: 'asc' },
      include: videoCallInclude,
    });
  }

  updateVideoCall(
    callId: string,
    data: {
      status?: VideoCallStatus;
      startedAt?: Date | null;
      endedAt?: Date | null;
      providerRoomName?: string | null;
    },
  ): Promise<VideoCallRecord> {
    return this.prisma.videoCall.update({
      where: { id: callId },
      data,
      include: videoCallInclude,
    });
  }

  findUserAuthor(userId: string): Promise<LiveChatAuthorRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: LIVE_CHAT_AUTHOR_SELECT,
    });
  }
}
