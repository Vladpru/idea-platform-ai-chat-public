import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

import { LIVEKIT_TOKEN_TTL_SECONDS } from './livekit.constants';

export type MintRoomTokenParams = {
  identity: string;
  name: string;
  providerRoomName: string;
  canPublish: boolean;
  canSubscribe: boolean;
  canPublishData: boolean;
  ttlSeconds?: number;
};

@Injectable()
export class LivekitTokenService {
  constructor(private readonly config: ConfigService) {}

  async mintRoomToken(params: MintRoomTokenParams): Promise<string> {
    const accessToken = new AccessToken(this.getApiKey(), this.getApiSecret(), {
      identity: params.identity,
      name: params.name,
      ttl: params.ttlSeconds ?? LIVEKIT_TOKEN_TTL_SECONDS,
    });

    accessToken.addGrant({
      roomJoin: true,
      room: params.providerRoomName,
      canPublish: params.canPublish,
      canSubscribe: params.canSubscribe,
      canPublishData: params.canPublishData,
    });

    return accessToken.toJwt();
  }

  getLivekitUrl(): string {
    return this.config.getOrThrow<string>('livekit.url');
  }

  private getApiKey(): string {
    return this.config.getOrThrow<string>('livekit.apiKey');
  }

  private getApiSecret(): string {
    return this.config.getOrThrow<string>('livekit.apiSecret');
  }
}
