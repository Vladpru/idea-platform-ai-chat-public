import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import sgMail from '@sendgrid/mail';

import { WelcomeEmail } from './templates/WelcomeEmail';
import { buildPasswordResetEmail } from './templates/password-reset';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly defaultFrom: string;

  constructor(private readonly config: ConfigService) {
    sgMail.setApiKey(this.config.getOrThrow<string>('SENDGRID_API_KEY'));
    this.defaultFrom = this.config.getOrThrow<string>('SENDGRID_FROM_EMAIL');
  }

  async sendWelcomeEmail(params: { to: string }) {
    const subject = 'Welcome to The Idea Platform';

    const html = await render(WelcomeEmail());
    const text = await render(WelcomeEmail(), { plainText: true });

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
      throw new InternalServerErrorException(
        'Unable to send welcome email, try again later',
      );
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
      throw new InternalServerErrorException(
        'Unable to send email, try again later',
      );
    }
  }
}
