import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';

import { enrichNotificationEmail } from '../../core/mail/lib/enrich-notification-email';
import { MailService } from '../../core/mail/mail.service';
import type { NotificationEmailJobData } from '../../core/mail/types/notification-email.types';
import { PrismaService } from '../../core/prisma/prisma.service';
import { runInBackgroundJobContext } from '../../shared/context/request-context';
import { NOTIFICATION_EMAIL_QUEUE } from './constants/notification-queue.constants';

@Processor(NOTIFICATION_EMAIL_QUEUE)
export class NotificationEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationEmailProcessor.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<NotificationEmailJobData>): Promise<void> {
    try {
      await runInBackgroundJobContext(async () => {
        const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
        const enriched = await enrichNotificationEmail(
          this.prisma,
          job.data,
          frontendUrl,
        );

        await this.mailService.sendNotificationEmail(job.data, enriched);
      });
    } catch (error) {
      this.logger.error(
        `Notification email job ${job.id} failed for ${job.data.notificationType}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
