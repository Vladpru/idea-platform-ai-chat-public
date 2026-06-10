export type NotificationPreferenceKey =
  | 'newSimilarIdeas'
  | 'newSimilarProblems'
  | 'statusChange'
  | 'newSupporters'
  | 'newComments'
  | 'assignedIdeasAndProblems'
  | 'followUps'
  | 'directMessages';

export type NotificationChannelPreferences = {
  inApp: boolean;
  email: boolean;
};

export type NotificationPreferencesMap = Record<
  NotificationPreferenceKey,
  NotificationChannelPreferences
>;

export const NOTIFICATION_PREFERENCE_KEYS: NotificationPreferenceKey[] = [
  'newSimilarIdeas',
  'newSimilarProblems',
  'statusChange',
  'newSupporters',
  'newComments',
  'assignedIdeasAndProblems',
  'followUps',
  'directMessages',
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesMap = {
  newSimilarIdeas: { inApp: true, email: true },
  newSimilarProblems: { inApp: true, email: true },
  statusChange: { inApp: true, email: true },
  newSupporters: { inApp: true, email: true },
  newComments: { inApp: true, email: true },
  assignedIdeasAndProblems: { inApp: false, email: false },
  followUps: { inApp: true, email: true },
  directMessages: { inApp: true, email: true },
};

export type UpdateNotificationPreferencesPayload =
  Partial<NotificationPreferencesMap>;

export function mergeNotificationPreferences(
  existing: NotificationPreferencesMap,
  partial: UpdateNotificationPreferencesPayload,
): NotificationPreferencesMap {
  const merged: NotificationPreferencesMap = { ...existing };

  for (const key of NOTIFICATION_PREFERENCE_KEYS) {
    const update = partial[key];
    if (!update) {
      continue;
    }

    merged[key] = {
      inApp: update.inApp ?? merged[key].inApp,
      email: update.email ?? merged[key].email,
    };
  }

  return merged;
}

export function buildAllChannelsPatch(
  value: boolean,
): UpdateNotificationPreferencesPayload {
  return Object.fromEntries(
    NOTIFICATION_PREFERENCE_KEYS.map(key => [
      key,
      { inApp: value, email: value },
    ]),
  ) as UpdateNotificationPreferencesPayload;
}
