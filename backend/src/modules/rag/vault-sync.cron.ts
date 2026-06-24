import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { VaultSyncService } from './vault-sync.service';

@Injectable()
export class VaultSyncCron {
  private readonly logger = new Logger(VaultSyncCron.name);

  constructor(private readonly vaultSyncService: VaultSyncService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron(): Promise<void> {
    try {
      this.logger.log('Vault sync started');
      const result = await this.vaultSyncService.syncVault();
      this.logger.log(
        `Vault sync — added: ${result.added}, updated: ${result.updated}, removed: ${result.removed}, skipped: ${result.skipped}`,
      );
    } catch (error) {
      this.logger.error('Vault sync cron failed', error);
    }
  }
}
