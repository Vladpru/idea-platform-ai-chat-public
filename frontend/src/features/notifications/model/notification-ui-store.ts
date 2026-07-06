import { create } from 'zustand';

type NotificationUiState = {
  hasNewNotification: boolean;
  setHasNewNotification: (value: boolean) => void;
};

export const useNotificationUiStore = create<NotificationUiState>()(set => ({
  hasNewNotification: false,
  setHasNewNotification: value => set({ hasNewNotification: value }),
}));
