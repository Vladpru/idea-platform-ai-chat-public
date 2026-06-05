import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { EntityEmbeddingSyncService } from './entity-embedding-sync.service';

@Injectable()
export class EmbeddingCron {
  private readonly logger = new Logger(EmbeddingCron.name);

  constructor(private readonly syncService: EntityEmbeddingSyncService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      await this.syncService.processPendingBatch(10);
    } catch (error) {
      this.logger.error('Embedding sync cron failed', error);
    }
  }
}
