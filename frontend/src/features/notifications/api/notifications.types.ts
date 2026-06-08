export type NotificationPayload = Record<string, unknown>;

export type NotificationDto = {
  id: string;
  type: string;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
};

export type PaginatedNotificationsMeta = {
  limit: number;
  hasNextPage: boolean;
  nextCursor: string | null;
};

export type PaginatedNotificationsResponse = {
  data: NotificationDto[];
  meta: PaginatedNotificationsMeta;
};

export type UnreadCountResponse = {
  count: number;
};

export type FetchNotificationsParams = {
  cursor?: string;
  limit?: number;
};
