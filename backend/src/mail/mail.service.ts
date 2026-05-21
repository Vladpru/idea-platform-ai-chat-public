import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';

import { WelcomeEmail } from './templates/WelcomeEmail';
import { buildPasswordResetEmail } from './templates/password-reset';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.config.getOrThrow<string>('GMAIL_SMTP_USER'),
        pass: this.config.getOrThrow<string>('GMAIL_SMTP_PASS'),
      },
    });
  }

  async sendWelcomeEmail(params: { to: string }) {
    const from = this.config.getOrThrow<string>('GMAIL_SMTP_USER');
    const subject = 'Welcome to The Idea Platform';

    const html = await render(WelcomeEmail());
    const text = await render(WelcomeEmail(), { plainText: true });

    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error('SMTP send failed during welcome email', error);
    }
  }

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
    expiresMinutes: number;
  }) {
    const from = this.config.getOrThrow<string>('GMAIL_SMTP_USER');
    const { subject, text, html } = buildPasswordResetEmail(params);

    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error('SMTP send failed during password reset email', error);
      throw new InternalServerErrorException(
        'Unable to send email, try again later',
      );
    }
  }
}
