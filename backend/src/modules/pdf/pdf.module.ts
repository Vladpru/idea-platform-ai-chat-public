import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { PDF_EXPORT_JOB_OPTIONS, PDF_EXPORT_QUEUE } from './constants/pdf-queue.constants';
import { PdfController } from './pdf.controller';
import { PdfProcessor } from './pdf.processor';
import { PdfService } from './pdf.service';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    BullModule.registerQueue({
      name: PDF_EXPORT_QUEUE,
      defaultJobOptions: PDF_EXPORT_JOB_OPTIONS,
    }),
  ],
  controllers: [PdfController],
  providers: [PdfService, PdfProcessor],
})
export class PdfModule {}
