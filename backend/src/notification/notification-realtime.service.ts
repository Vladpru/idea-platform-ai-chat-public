import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { RealtimePublisherService } from '../realtime/realtime-publisher.service';
import { REALTIME_NAMESPACES } from '../realtime/realtime.types';
import { NOTIFICATION_EVENTS } from './events/notification-event-names';
import type { AchievementUnlockedEvent } from './events/notification.events';
import { userRoom } from './lib/notification-room.util';
import type { NotificationSignalEvent } from './types/notification.types';

/**
 * Maps notification domain signals to outbound realtime broadcasts via the
 * publisher. Extracted from NotificationGateway so the gateway no longer holds
 * business-facing methods or listens to domain events directly.
 */
@Injectable()
export class NotificationRealtimeService {
  constructor(private readonly publisher: RealtimePublisherService) {}

  notifyUser(userId: string): void {
    const payload: NotificationSignalEvent = { type: 'NOTIFICATION_NEW' };
    this.publisher.publish(
      { namespace: REALTIME_NAMESPACES.ROOT, room: userRoom(userId) },
      'notification',
      payload,
    );
  }

  @OnEvent(NOTIFICATION_EVENTS.ACHIEVEMENT_UNLOCKED)
  handleAchievementUnlocked(event: AchievementUnlockedEvent): void {
    this.publisher.publish(
      { namespace: REALTIME_NAMESPACES.ROOT, room: userRoom(event.userId) },
      'achievement_unlocked',
      event.badge,
    );
  }
}
