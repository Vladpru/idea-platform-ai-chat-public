import type { Prisma } from '../../../generated/prisma/client';
import type {
  NotificationChannelPreferences,
  NotificationPreferenceKey,
  NotificationPreferencesMap,
} from '../events/notification.events';

const PREFERENCE_KEYS: NotificationPreferenceKey[] = [
  'newSimilarIdeas',
  'newSimilarProblems',
  'statusChange',
  'newSupporters',
  'newComments',
  'assignedIdeasAndProblems',
  'followUps',
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesMap = {
  newSimilarIdeas: { inApp: true, email: true },
  newSimilarProblems: { inApp: true, email: true },
  statusChange: { inApp: true, email: true },
  newSupporters: { inApp: true, email: true },
  newComments: { inApp: true, email: true },
  assignedIdeasAndProblems: { inApp: false, email: false },
  followUps: { inApp: true, email: true },
};

function isChannelPreferences(
  value: unknown,
): value is NotificationChannelPreferences {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'inApp' in value &&
    typeof value.inApp === 'boolean' &&
    'email' in value &&
    typeof value.email === 'boolean'
  );
}

export function parseNotificationPreferences(
  value: Prisma.JsonValue,
): NotificationPreferencesMap {
  const parsed: Partial<NotificationPreferencesMap> = {};

  for (const key of PREFERENCE_KEYS) {
    parsed[key] = { ...DEFAULT_NOTIFICATION_PREFERENCES[key] };
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return parsed as NotificationPreferencesMap;
  }

  const objValue = value as Record<string, unknown>;

  for (const key of PREFERENCE_KEYS) {
    const candidate = objValue[key];
    if (isChannelPreferences(candidate)) {
      parsed[key] = { ...candidate };
    }
  }

  return parsed as NotificationPreferencesMap;
}

export function getChannelPreferences(
  preferences: NotificationPreferencesMap,
  key: NotificationPreferenceKey,
): NotificationChannelPreferences {
  return { ...(preferences[key] ?? DEFAULT_NOTIFICATION_PREFERENCES[key]) };
}

export function mergeNotificationPreferences(
  existing: NotificationPreferencesMap,
  partial: Partial<NotificationPreferencesMap>,
): NotificationPreferencesMap {
  const merged: Partial<NotificationPreferencesMap> = {};

  for (const key of PREFERENCE_KEYS) {
    const current = existing[key] ?? DEFAULT_NOTIFICATION_PREFERENCES[key];
    const update = partial[key];

    merged[key] = {
      inApp: update?.inApp ?? current.inApp,
      email: update?.email ?? current.email,
    };
  }

  return merged as NotificationPreferencesMap;
}
