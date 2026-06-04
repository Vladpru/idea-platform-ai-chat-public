import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { EmbeddingSyncService } from '../src/embedding/embedding-sync.service';
import { PrismaService } from '../src/prisma/prisma.service';

type EntityType = 'idea' | 'problem' | 'tag' | 'all';

const logger = new Logger('BackfillEmbeddings');

function parseEntity(value: string | undefined): EntityType {
  if (
    value === 'idea' ||
    value === 'problem' ||
    value === 'tag' ||
    value === 'all'
  ) {
    return value;
  }
  throw new Error(
    `Invalid --entity value "${value ?? ''}". Expected idea, problem, tag, or all.`,
  );
}

function parseBatch(value: string | undefined): number {
  const batch = Number(value ?? 50);
  if (!Number.isInteger(batch) || batch < 1) {
    throw new Error(
      `Invalid --batch value "${value ?? ''}". Expected a positive integer.`,
    );
  }
  return batch;
}

function parseCliArgs(): { entity: EntityType; batch: number } {
  const entityArg = process.argv.find(arg => arg.startsWith('--entity='));
  const batchArg = process.argv.find(arg => arg.startsWith('--batch='));

  return {
    entity: parseEntity(entityArg?.split('=')[1]),
    batch: parseBatch(batchArg?.split('=')[1]),
  };
}

async function backfillIdeas(
  prisma: PrismaService,
  embeddingSyncService: EmbeddingSyncService,
  batch: number,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  let lastId = '';

  while (true) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM idea
      WHERE ai_embedding IS NULL AND id > ${lastId}
      ORDER BY id ASC LIMIT ${batch}
    `;

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      try {
        await embeddingSyncService.syncIdeaEmbedding(row.id);
        processed += 1;
        logger.log(
          `Synced idea ${row.id} (${processed} processed, ${failed} failed)`,
        );
      } catch (error) {
        failed += 1;
        logger.error(`Failed idea ${row.id}: ${String(error)}`);
      }
    }

    lastId = rows.at(-1)!.id;
  }

  return { processed, failed };
}

async function backfillProblems(
  prisma: PrismaService,
  embeddingSyncService: EmbeddingSyncService,
  batch: number,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  let lastId = '';

  while (true) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM problem
      WHERE ai_embedding IS NULL AND id > ${lastId}
      ORDER BY id ASC LIMIT ${batch}
    `;

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      try {
        await embeddingSyncService.syncProblemEmbedding(row.id);
        processed += 1;
        logger.log(
          `Synced problem ${row.id} (${processed} processed, ${failed} failed)`,
        );
      } catch (error) {
        failed += 1;
        logger.error(`Failed problem ${row.id}: ${String(error)}`);
      }
    }

    lastId = rows.at(-1)!.id;
  }

  return { processed, failed };
}

async function backfillTags(
  prisma: PrismaService,
  embeddingSyncService: EmbeddingSyncService,
  batch: number,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  let lastId = '';

  while (true) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM tag
      WHERE ai_embedding IS NULL AND id > ${lastId}
      ORDER BY id ASC LIMIT ${batch}
    `;

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      try {
        await embeddingSyncService.syncTagEmbedding(row.id);
        processed += 1;
        logger.log(
          `Synced tag ${row.id} (${processed} processed, ${failed} failed)`,
        );
      } catch (error) {
        failed += 1;
        logger.error(`Failed tag ${row.id}: ${String(error)}`);
      }
    }

    lastId = rows.at(-1)!.id;
  }

  return { processed, failed };
}

async function main(): Promise<void> {
  const { entity, batch } = parseCliArgs();

  logger.log(`Starting backfill (entity=${entity}, batch=${batch})`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const embeddingSyncService = app.get(EmbeddingSyncService);

    if (entity === 'idea' || entity === 'all') {
      const ideaStats = await backfillIdeas(
        prisma,
        embeddingSyncService,
        batch,
      );
      logger.log(
        `Ideas complete: ${ideaStats.processed} processed, ${ideaStats.failed} failed`,
      );
    }

    if (entity === 'problem' || entity === 'all') {
      const problemStats = await backfillProblems(
        prisma,
        embeddingSyncService,
        batch,
      );
      logger.log(
        `Problems complete: ${problemStats.processed} processed, ${problemStats.failed} failed`,
      );
    }

    if (entity === 'tag' || entity === 'all') {
      const tagStats = await backfillTags(prisma, embeddingSyncService, batch);
      logger.log(
        `Tags complete: ${tagStats.processed} processed, ${tagStats.failed} failed`,
      );
    }

    logger.log('Backfill finished');
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
