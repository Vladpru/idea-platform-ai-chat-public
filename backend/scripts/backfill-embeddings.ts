import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { EmbeddingCron } from '../src/embedding/embedding.cron';
import { PrismaService } from '../src/prisma/prisma.service';

type EntityType = 'idea' | 'problem' | 'all';

const logger = new Logger('BackfillEmbeddings');

function parseEntity(value: string | undefined): EntityType {
  if (value === 'idea' || value === 'problem' || value === 'all') {
    return value;
  }
  throw new Error(
    `Invalid --entity value "${value ?? ''}". Expected idea, problem, or all.`,
  );
}

function parseCliArgs(): { entity: EntityType } {
  const entityArg = process.argv.find(arg => arg.startsWith('--entity='));
  return {
    entity: parseEntity(entityArg?.split('=')[1]),
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

async function main(): Promise<void> {
  const { entity } = parseCliArgs();

  logger.log(`Starting backfill (entity=${entity})`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const embeddingCron = app.get(EmbeddingCron);

    const tables: ('idea' | 'problem')[] =
      entity === 'all' ? ['idea', 'problem'] : [entity];

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
