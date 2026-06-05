import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { SummaryStatus } from '../generated/prisma/client';
import { AiSummaryModule } from '../src/ai-summary/ai-summary.module';
import { AiSummaryService } from '../src/ai-summary/ai-summary.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiSummaryModule,
  ],
})
class BackfillModule {}

const logger = new Logger('BackfillAiSummaries');
const DEFAULT_DELAY_MS = 2500;

function parseDelayMs(value: string | undefined): number {
  const delay = Number(value ?? DEFAULT_DELAY_MS);
  if (!Number.isFinite(delay) || delay <= 0) {
    throw new Error(
      `Invalid --delay value "${value ?? ''}". Expected a positive number.`,
    );
  }
  return delay;
}

function parseCliArgs(): { delayMs: number } {
  const delayArg = process.argv.find(arg => arg.startsWith('--delay='));
  const rawValue = delayArg?.slice('--delay='.length);

  return {
    delayMs: parseDelayMs(rawValue),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
let processed = 0;
let failed = 0;

async function main(): Promise<void> {
  const { delayMs } = parseCliArgs();

  logger.log(`Starting AI summary backfill (delayMs=${delayMs})`);

  const app = await NestFactory.createApplicationContext(BackfillModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const aiSummaryService = app.get(AiSummaryService);

    const ideas = await prisma.idea.findMany({
      where: { summaryStatus: SummaryStatus.PENDING },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const problems = await prisma.problem.findMany({
      where: { summaryStatus: SummaryStatus.PENDING },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const total = ideas.length + problems.length;
    logger.log(
      `Found ${ideas.length} ideas and ${problems.length} problems pending (${total} total)`,
    );

    for (const idea of ideas) {
      processed += 1;
      logger.log(`Processing idea ${idea.id} (${processed}/${total})`);

      try {
        await aiSummaryService.processSummaryRequest({
          entityType: 'idea',
          id: idea.id,
        });
      } catch (error) {
        failed += 1;
        logger.error(`Failed idea ${idea.id}: ${String(error)}`);
      }

      if (processed < total) {
        await sleep(delayMs);
      }
    }

    for (const problem of problems) {
      processed += 1;
      logger.log(`Processing problem ${problem.id} (${processed}/${total})`);

      try {
        await aiSummaryService.processSummaryRequest({
          entityType: 'problem',
          id: problem.id,
        });
      } catch (error) {
        failed += 1;
        logger.error(`Failed problem ${problem.id}: ${String(error)}`);
      }

      if (processed < total) {
        await sleep(delayMs);
      }
    }

    logger.log(
      `Backfill finished: ${processed} processed, ${failed} failed, ${total} total`,
    );
  } finally {
    await app
      .close()
      .catch(err => logger.error(`Failed to close app: ${String(err)}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  logger.error(`Backfill failed: ${String(error)}`);
  process.exit(1);
});
