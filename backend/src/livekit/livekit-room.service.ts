import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoomServiceClient } from 'livekit-server-sdk';

import { LIVEKIT_ROOM_EMPTY_TIMEOUT_SECONDS } from './livekit.constants';

@Injectable()
export class LivekitRoomService {
  private roomServiceClient: RoomServiceClient | null = null;

  constructor(private readonly config: ConfigService) {}

  async createRoom(
    name: string,
    emptyTimeout: number = LIVEKIT_ROOM_EMPTY_TIMEOUT_SECONDS,
  ): Promise<void> {
    await this.getRoomServiceClient().createRoom({
      name,
      emptyTimeout,
    });
  }

  async deleteRoom(name: string): Promise<void> {
    await this.getRoomServiceClient().deleteRoom(name);
  }

  private getRoomServiceClient(): RoomServiceClient {
    if (!this.roomServiceClient) {
      this.roomServiceClient = new RoomServiceClient(
        this.config.getOrThrow<string>('livekit.httpUrl'),
        this.config.getOrThrow<string>('livekit.apiKey'),
        this.config.getOrThrow<string>('livekit.apiSecret'),
      );
    }

    return this.roomServiceClient;
  }
}
