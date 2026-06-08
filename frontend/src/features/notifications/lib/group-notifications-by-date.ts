import type { NotificationDto } from '../api/notifications.types';

export type NotificationDateGroupKey =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'older';

export type NotificationDateGroup = {
  key: NotificationDateGroupKey;
  label: string;
  items: NotificationDto[];
};

const GROUP_LABELS: Record<NotificationDateGroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Last 7 days',
  older: 'Older',
};

const GROUP_ORDER: NotificationDateGroupKey[] = [
  'today',
  'yesterday',
  'last7days',
  'older',
];

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function classifyNotificationDate(
  createdAt: string,
  now: Date = new Date(),
): NotificationDateGroupKey {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return 'older';
  }

  const todayStart = startOfDay(now);
  const createdStart = startOfDay(created);
  const diffDays = Math.floor(
    (todayStart.getTime() - createdStart.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) {
    return 'today';
  }

  if (diffDays === 1) {
    return 'yesterday';
  }

  if (diffDays >= 2 && diffDays <= 7) {
    return 'last7days';
  }

  return 'older';
}

export function groupNotificationsByDate(
  notifications: NotificationDto[],
): NotificationDateGroup[] {
  const buckets = new Map<NotificationDateGroupKey, NotificationDto[]>();

  for (const notification of notifications) {
    const key = classifyNotificationDate(notification.createdAt);
    const existing = buckets.get(key) ?? [];
    existing.push(notification);
    buckets.set(key, existing);
  }

  return GROUP_ORDER.filter(key => buckets.has(key)).map(key => ({
    key,
    label: GROUP_LABELS[key],
    items: buckets.get(key) ?? [],
  }));
}
