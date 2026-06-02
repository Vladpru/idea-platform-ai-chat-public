import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationKey =
  | 'newSimilarIdeas'
  | 'newSimilarProblems'
  | 'statusChange'
  | 'newSupporters'
  | 'newComments'
  | 'assignedIdeasAndProblems'
  | 'followUps';

export type NotificationChannels = Record<
  NotificationKey,
  { inApp: boolean; email: boolean }
>;

type NotificationState = {
  channels: NotificationChannels;
  setAll: (value: boolean) => void;
  setOneChannel: (
    key: NotificationKey,
    channel: 'inApp' | 'email',
    value: boolean,
  ) => void;
};

const KEYS: NotificationKey[] = [
  'newSimilarIdeas',
  'newSimilarProblems',
  'statusChange',
  'newSupporters',
  'newComments',
  'assignedIdeasAndProblems',
  'followUps',
];

const DEFAULT_CHANNELS: NotificationChannels = {
  newSimilarIdeas: { inApp: true, email: true },
  newSimilarProblems: { inApp: true, email: true },
  statusChange: { inApp: true, email: true },
  newSupporters: { inApp: true, email: true },
  newComments: { inApp: true, email: true },
  assignedIdeasAndProblems: { inApp: true, email: true },
  followUps: { inApp: true, email: true },
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    set => ({
      channels: DEFAULT_CHANNELS,
      setAll: value =>
        set(() => ({
          channels: Object.fromEntries(
            KEYS.map(key => [key, { inApp: value, email: value }]),
          ) as NotificationChannels,
        })),
      setOneChannel: (key, channel, value) =>
        set(state => ({
          channels: {
            ...state.channels,
            [key]: {
              ...state.channels[key],
              [channel]: value,
            },
          },
        })),
    }),
    {
      name: 'sollicoders-notification-settings',
    },
  ),
);
