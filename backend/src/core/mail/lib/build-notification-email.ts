import { render } from '@react-email/components';

import {
  renderNotificationEmail,
  resolveNotificationEmailContent,
} from '../templates/notification-email';
import type {
  NotificationEmailBuildInput,
  NotificationEmailContent,
} from '../types/notification-email.types';

export async function buildNotificationEmail(
  input: NotificationEmailBuildInput,
): Promise<NotificationEmailContent> {
  const { enriched, ...data } = input;

  const content = resolveNotificationEmailContent(data);
  const template = renderNotificationEmail(data, content, enriched);
  const html = await render(template);

  return { ...content, html };
}
