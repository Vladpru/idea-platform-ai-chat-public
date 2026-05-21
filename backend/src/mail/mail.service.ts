import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { buildPasswordResetEmail } from './templates/password-reset';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      // Render free tier has no outbound IPv6; `family:4` on top-level options gets
      // stripped before nodemailer builds the socket, so we override via createConnection.
      createConnection: (opts: any) => net.createConnection({ ...opts, family: 4 }),
      auth: {
        user: this.config.getOrThrow<string>('GMAIL_SMTP_USER'),
        pass: this.config.getOrThrow<string>('GMAIL_SMTP_PASS'),
      },
    } as any);
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
      this.logger.error('SMTP send failed', error);
      throw new InternalServerErrorException(
        'Unable to send email, try again later',
      );
    }
  }
}
