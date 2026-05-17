import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { buildPasswordResetEmail } from './templates/password-reset';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
  }

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
    expiresMinutes: number;
  }) {
    const from = this.config.getOrThrow<string>('RESEND_FROM_EMAIL');
    const { subject, text, html } = buildPasswordResetEmail(params);

    const { error } = await this.resend.emails.send({
      from,
      to: params.to,
      subject,
      text,
      html,
    });

    if (error) {
      this.logger.error(`Resend failed: ${error.message}`, error);
      throw new InternalServerErrorException(
        'Unable to send email, try again later',
      );
    }
  }
}
