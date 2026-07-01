import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { EntityChunkSyncService } from './entity-chunk-sync.service';
import { VaultSyncService } from './vault-sync.service';

@Injectable()
export class VaultSyncCron {
  private readonly logger = new Logger(VaultSyncCron.name);

  constructor(
    private readonly vaultSyncService: VaultSyncService,
    private readonly entityChunkSyncService: EntityChunkSyncService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleVaultSync(): Promise<void> {
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

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleEntityReconcile(): Promise<void> {
    try {
      this.logger.log('Entity chunk reconciliation started');
      const result = await this.entityChunkSyncService.reconcileAll();
      this.logger.log(
        `Entity reconciliation — synced: ${result.synced}, removed: ${result.removed}`,
      );
    } catch (error) {
      this.logger.error('Entity reconciliation cron failed', error);
    }
  }
}
