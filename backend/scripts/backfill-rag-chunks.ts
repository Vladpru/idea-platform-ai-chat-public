import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { EntityChunkSyncService } from '../src/modules/rag/entity-chunk-sync.service';

const logger = new Logger('BackfillRagChunks');
const BATCH_SIZE = 50;

async function backfillIdeas(
  prisma: PrismaService,
  syncService: EntityChunkSyncService,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  let cursor: string | undefined;

  while (true) {
    const rows = await prisma.idea.findMany({
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
        await syncService.syncEntity('idea', row.id);
        processed++;
        logger.log(
          `Synced idea ${row.id} (${processed} processed, ${failed} failed)`,
        );
      } catch (error) {
        failed++;
        logger.error(`Failed idea ${row.id}: ${String(error)}`);
      }
    }

    cursor = rows.at(-1)!.id;
    if (rows.length < BATCH_SIZE) break;
  }

  return { processed, failed };
}

async function backfillProblems(
  prisma: PrismaService,
  syncService: EntityChunkSyncService,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  let cursor: string | undefined;

  while (true) {
    const rows = await prisma.problem.findMany({
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
        await syncService.syncEntity('problem', row.id);
        processed++;
        logger.log(
          `Synced problem ${row.id} (${processed} processed, ${failed} failed)`,
        );
      } catch (error) {
        failed++;
        logger.error(`Failed problem ${row.id}: ${String(error)}`);
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

    const ideaStats = await backfillIdeas(prisma, syncService);
    logger.log(
      `Ideas: ${ideaStats.processed} processed, ${ideaStats.failed} failed`,
    );

    const problemStats = await backfillProblems(prisma, syncService);
    logger.log(
      `Problems: ${problemStats.processed} processed, ${problemStats.failed} failed`,
    );

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
