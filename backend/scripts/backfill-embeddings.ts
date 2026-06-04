import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import {
  buildTagEmbeddingContent,
  hashEmbeddingContent,
} from '../src/embedding/embedding-content.util';
import { EmbeddingCron } from '../src/embedding/embedding.cron';
import { EmbeddingService } from '../src/embedding/embedding.service';
import { toPgVectorLiteral } from '../src/embedding/vector.util';
import { PrismaService } from '../src/prisma/prisma.service';

type EntityType = 'idea' | 'problem' | 'tag' | 'all';

const logger = new Logger('BackfillEmbeddings');
const DEFAULT_BATCH = 50;

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
  const batch = Number(value ?? DEFAULT_BATCH);
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

async function countPending(
  prisma: PrismaService,
  table: 'idea' | 'problem',
): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "${table}" WHERE ai_embedding IS NULL`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function syncTagEmbedding(
  prisma: PrismaService,
  embeddingService: EmbeddingService,
  tagId: string,
): Promise<void> {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true, name: true, label: true, embeddingHash: true },
  });

  if (!tag) {
    return;
  }

  const content = buildTagEmbeddingContent({
    name: tag.name,
    label: tag.label,
  });
  const hash = hashEmbeddingContent(content);

  if (hash !== null && hash === tag.embeddingHash) {
    return;
  }

  if (hash === null) {
    await prisma.$executeRaw`
      UPDATE tag
      SET ai_embedding = NULL, embedding_hash = NULL
      WHERE id = ${tagId}
    `;
    return;
  }

  const vector = await embeddingService.embedText(content);
  const vectorLiteral = toPgVectorLiteral(vector);

  await prisma.$executeRaw`
    UPDATE tag
    SET ai_embedding = ${vectorLiteral}::vector, embedding_hash = ${hash}
    WHERE id = ${tagId}
  `;
}

async function backfillTags(
  prisma: PrismaService,
  embeddingService: EmbeddingService,
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
        await syncTagEmbedding(prisma, embeddingService, row.id);
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

async function backfillIdeasAndProblems(
  prisma: PrismaService,
  embeddingCron: EmbeddingCron,
  entity: EntityType,
): Promise<void> {
  const tables: ('idea' | 'problem')[] =
    entity === 'all' ? ['idea', 'problem'] : [entity as 'idea' | 'problem'];

  for (const table of tables) {
    let pending = await countPending(prisma, table);
    logger.log(`${table}: ${pending} pending embeddings`);

    let stalledPasses = 0;

    while (pending > 0) {
      const before = pending;
      await embeddingCron.processPendingEmbeddings();
      pending = await countPending(prisma, table);

      if (pending >= before) {
        stalledPasses += 1;
        if (stalledPasses >= 3) {
          logger.warn(
            `${table}: no progress (${pending} still pending), stopping`,
          );
          break;
        }
      } else {
        stalledPasses = 0;
      }
    }

    logger.log(`${table}: backfill pass complete`);
  }
}

async function main(): Promise<void> {
  const { entity, batch } = parseCliArgs();

  logger.log(`Starting backfill (entity=${entity}, batch=${batch})`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const embeddingCron = app.get(EmbeddingCron);
    const embeddingService = app.get(EmbeddingService);

    if (entity === 'idea' || entity === 'problem' || entity === 'all') {
      await backfillIdeasAndProblems(prisma, embeddingCron, entity);
    }

    if (entity === 'tag' || entity === 'all') {
      const tagStats = await backfillTags(prisma, embeddingService, batch);
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
