import { api } from '@/shared/api/http';

import type {
  NotificationPreferencesMap,
  UpdateNotificationPreferencesPayload,
} from '../model/notification-preferences.types';

export type UpdateNotificationPreferencesResponse = {
  notificationPreferences: NotificationPreferencesMap;
};

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferencesPayload,
): Promise<UpdateNotificationPreferencesResponse> {
  const { data } = await api.patch<UpdateNotificationPreferencesResponse>(
    '/users/me/notification-preferences',
    payload,
  );
  return data;
}
