import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaService } from '../../core/prisma/prisma.service';
import { collectVaultFiles } from './lib/collect-vault-files.util';
import { computeFileHash } from './lib/file-hash.util';
import { ObsidianIngestionService } from './obsidian-ingestion.service';

export interface VaultSyncResult {
  added: number;
  updated: number;
  removed: number;
  skipped: number;
}

@Injectable()
export class VaultSyncService {
  private readonly logger = new Logger(VaultSyncService.name);
  private readonly vaultPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestionService: ObsidianIngestionService,
    private readonly config: ConfigService,
  ) {
    this.vaultPath = this.config.getOrThrow<string>('OBSIDIAN_VAULT_PATH');
  }

  async syncVault(): Promise<VaultSyncResult> {
    const files = collectVaultFiles(this.vaultPath);
    const fileRelPaths = new Set(files.map(f => path.relative(this.vaultPath, f)));

    const existingSources = await this.getExistingSources();
    const existingSourceSet = new Set(existingSources);

    let removed = 0;
    for (const source of existingSources) {
      if (!fileRelPaths.has(source)) {
        await this.prisma.$executeRaw`DELETE FROM knowledge_chunk WHERE source = ${source}`;
        this.logger.log(`Removed chunks for deleted file: ${source}`);
        removed++;
      }
    }

    let added = 0, updated = 0, skipped = 0;

    for (const filePath of files) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const fileHash = computeFileHash(raw);
      const relSource = path.relative(this.vaultPath, filePath);

      const [{ count }] = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM knowledge_chunk
        WHERE source = ${relSource} AND file_hash = ${fileHash}
      `;

      if (count > 0n) {
        skipped++;
        continue;
      }

      await this.prisma.$executeRaw`DELETE FROM knowledge_chunk WHERE source = ${relSource}`;
      await this.ingestionService.ingestFile(filePath, fileHash);

      if (existingSourceSet.has(relSource)) {
        updated++;
      } else {
        added++;
      }
    }

    return { added, updated, removed, skipped };
  }

  private async getExistingSources(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ source: string }>>`
      SELECT DISTINCT source FROM knowledge_chunk
    `;
    return rows.map(r => r.source);
  }
}
