import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

import { buildNotificationEmail } from './lib/build-notification-email';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { buildPasswordResetEmail } from './templates/password-reset';
import type { EnrichedEmailContext } from './types/enriched-email.types';
import type { NotificationEmailJobData } from './types/notification-email.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly defaultFrom: string;

  constructor(private readonly config: ConfigService) {
    sgMail.setApiKey(this.config.getOrThrow<string>('SENDGRID_API_KEY'));
    this.defaultFrom = this.config.getOrThrow<string>('SENDGRID_FROM_EMAIL');
  }

  async sendWelcomeEmail(params: { to: string }) {
    const { buildWelcomeEmail } = await import('./templates/welcome-email');
    const { subject, text, html } = await buildWelcomeEmail();

    try {
      await sgMail.send({
        from: this.defaultFrom,
        to: params.to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error('SendGrid send failed during welcome email', error);
      throw new Error('Unable to send welcome email');
    }
  }

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
    expiresMinutes: number;
  }) {
    const { subject, text, html } = await buildPasswordResetEmail(params);

    try {
      await sgMail.send({
        from: this.defaultFrom,
        to: params.to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error('SendGrid send failed during password reset', error);
      throw new Error('Unable to send password reset email');
    }
  }

  async sendNotificationEmail(
    data: NotificationEmailJobData,
    enriched?: EnrichedEmailContext,
  ): Promise<void> {
    const { subject, text, html } = await buildNotificationEmail({
      ...data,
      enriched,
    });

    try {
      await sgMail.send({
        from: this.defaultFrom,
        to: data.to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(
        `SendGrid send failed for notification ${data.notificationType}`,
        error,
      );
      throw new Error(`Notification email failed: ${String(error)}`);
    }
  }
}
