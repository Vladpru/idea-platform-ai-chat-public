import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

import { buildPasswordResetEmail } from './templates/password-reset';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    sgMail.setApiKey(this.config.getOrThrow<string>('SENDGRID_API_KEY'));
  }

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
    expiresMinutes: number;
  }) {
    const { subject, text, html } = buildPasswordResetEmail(params);

    try {
      await sgMail.send({
        from: 'andriy.varshko@oril.co',
        to: params.to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error('SendGrid send failed', error);
      throw new InternalServerErrorException('Unable to send email, try again later');
    }
  }
}
