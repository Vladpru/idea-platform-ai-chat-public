import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PrismaService } from '../../core/prisma/prisma.service';
import { runInBackgroundJobContext } from '../../shared/context/request-context';
import { NotificationGateway } from '../notification/notification.gateway';
import { PDF_EXPORT_QUEUE } from './constants/pdf-queue.constants';
import { PdfService } from './pdf.service';
import type { PdfExportJobData } from './types/pdf.types';

const PDF_READY_NOTIFICATION_TYPE = 'PDF_READY';

@Processor(PDF_EXPORT_QUEUE)
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {
    super();
  }

  async process(job: Job<PdfExportJobData>): Promise<void> {
    const { entityType, entityId, userId } = job.data;

    await runInBackgroundJobContext(async () => {
      let title: string;
      let payload;

      try {
        if (entityType === 'idea') {
          payload = await this.pdfService.buildIdeaPayload(entityId);
        } else {
          payload = await this.pdfService.buildProblemPayload(entityId);
        }
        title = payload.title;
      } catch (error) {
        this.logger.error(
          `Failed to build ${entityType} payload for entity ${entityId}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw error;
      }

      let downloadUrl: string;
      let expiresAt: string;

      try {
        const result = await this.pdfService.callPdfService(payload);
        downloadUrl = result.download_url;
        expiresAt = result.expires_at;
      } catch (error) {
        this.logger.error(
          `PDF service call failed for ${entityType} ${entityId}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw error;
      }

      const notificationPayload = {
        download_url: downloadUrl,
        expires_at: expiresAt,
        entity_type: entityType,
        entity_id: entityId,
        title,
      };

      try {
        await this.prisma.notification.create({
          data: {
            userId,
            type: PDF_READY_NOTIFICATION_TYPE,
            payload: notificationPayload,
          },
        });
        this.gateway.notifyUser(userId);
      } catch (error) {
        this.logger.error(
          `Failed to create PDF_READY notification for user ${userId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      this.gateway.notifyPdfReady(userId, notificationPayload);

      this.logger.log(
        `PDF ready for user ${userId}: ${entityType} ${entityId}`,
      );
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PdfExportJobData>): void {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) {
      return;
    }

    const { entityType, entityId, userId } = job.data;

    this.logger.warn(
      `PDF export permanently failed for user ${userId}: ${entityType} ${entityId}`,
    );

    this.gateway.notifyPdfFailed(userId, entityType);
  }
}
