import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { EntityChunkSyncService } from '../src/modules/rag/entity-chunk-sync.service';

type EntityType = 'idea' | 'problem';

const logger = new Logger('BackfillRagChunks');
const BATCH_SIZE = 50;

async function backfillEntities(
  prisma: PrismaService,
  syncService: EntityChunkSyncService,
  entityType: EntityType,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  let cursor: string | undefined;

  while (true) {
    const rows = await (prisma[entityType] as any).findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (rows.length === 0) break;

    for (const row of rows) {
      try {
        await syncService.syncEntity(entityType, row.id);
        processed++;
        logger.log(
          `Synced ${entityType} ${row.id} (${processed} processed, ${failed} failed)`,
        );
      } catch (error) {
        failed++;
        logger.error(`Failed ${entityType} ${row.id}: ${String(error)}`);
      }
    }

    cursor = rows.at(-1)!.id;
    if (rows.length < BATCH_SIZE) break;
  }

  return { processed, failed };
}

async function main(): Promise<void> {
  logger.log('Starting RAG chunk backfill for published ideas and problems');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const syncService = app.get(EntityChunkSyncService);

    const ideaStats = await backfillEntities(prisma, syncService, 'idea');
    logger.log(
      `Ideas: ${ideaStats.processed} processed, ${ideaStats.failed} failed`,
    );

    const problemStats = await backfillEntities(prisma, syncService, 'problem');
    logger.log(
      `Problems: ${problemStats.processed} processed, ${problemStats.failed} failed`,
    );

    const totalFailed = ideaStats.failed + problemStats.failed;
    if (totalFailed > 0) {
      logger.warn(`Backfill complete with ${totalFailed} failures`);
      process.exit(1);
    }

    logger.log('Backfill complete');
  } finally {
    await app
      .close()
      .catch(err => logger.error(`Failed to close app: ${String(err)}`));
  }

  process.exit(0);
}

main().catch(error => {
  logger.error(`Backfill failed: ${String(error)}`);
  process.exit(1);
});
