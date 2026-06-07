import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import {
  IdeaStatus,
  ProblemStatus,
  SummaryStatus,
} from '../generated/prisma/client';
import { AiSummaryModule } from '../src/ai-summary/ai-summary.module';
import { AiSummaryService } from '../src/ai-summary/ai-summary.service';
import { hasSummarizableContent } from '../src/ai-summary/summary-content.util';
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

async function main(): Promise<void> {
  const { delayMs } = parseCliArgs();

  logger.log(`Starting AI summary backfill (delayMs=${delayMs})`);

  const app = await NestFactory.createApplicationContext(BackfillModule, {
    logger: ['error', 'warn', 'log'],
  });

  let skipped = 0;

  let processed = 0;

  let failed = 0;

  try {
    const prisma = app.get(PrismaService);

    const aiSummaryService = app.get(AiSummaryService);

    const pendingIdeas = await prisma.idea.findMany({
      where: { summaryStatus: SummaryStatus.PENDING },

      select: {
        id: true,

        status: true,

        title: true,

        description: true,
      },

      orderBy: { id: 'asc' },
    });

    const pendingProblems = await prisma.problem.findMany({
      where: { summaryStatus: SummaryStatus.PENDING },

      select: {
        id: true,

        status: true,

        title: true,

        description: true,

        valueProposition: true,

        category: true,

        impact: true,
      },

      orderBy: { id: 'asc' },
    });

    logger.log(
      `Found ${pendingIdeas.length} pending ideas and ${pendingProblems.length} pending problems`,
    );

    for (const idea of pendingIdeas) {
      const shouldSkip =
        idea.status !== IdeaStatus.PUBLISHED ||
        !hasSummarizableContent({
          entityType: 'idea',

          title: idea.title,

          description: idea.description,
        });

      if (shouldSkip) {
        await prisma.idea.update({
          where: { id: idea.id },

          data: {
            aiSummary: null,

            summaryStatus: SummaryStatus.SKIPPED,
          },
        });

        skipped += 1;

        logger.log(`Skipped idea ${idea.id}`);

        continue;
      }
    }

    for (const problem of pendingProblems) {
      const shouldSkip =
        problem.status !== ProblemStatus.PUBLISHED ||
        !hasSummarizableContent({
          entityType: 'problem',

          title: problem.title,

          description: problem.description,

          valueProposition: problem.valueProposition,

          category: problem.category,

          impact: problem.impact,
        });

      if (shouldSkip) {
        await prisma.problem.update({
          where: { id: problem.id },

          data: {
            aiSummary: null,

            summaryStatus: SummaryStatus.SKIPPED,
          },
        });

        skipped += 1;

        logger.log(`Skipped problem ${problem.id}`);

        continue;
      }
    }

    const ideasToProcess = await prisma.idea.findMany({
      where: {
        summaryStatus: SummaryStatus.PENDING,

        status: IdeaStatus.PUBLISHED,
      },

      select: { id: true },

      orderBy: { id: 'asc' },
    });

    const problemsToProcess = await prisma.problem.findMany({
      where: {
        summaryStatus: SummaryStatus.PENDING,

        status: ProblemStatus.PUBLISHED,
      },

      select: { id: true },

      orderBy: { id: 'asc' },
    });

    const total = ideasToProcess.length + problemsToProcess.length;

    logger.log(
      `Processing ${ideasToProcess.length} ideas and ${problemsToProcess.length} problems (${total} total)`,
    );

    for (const idea of ideasToProcess) {
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

    for (const problem of problemsToProcess) {
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
      `Backfill finished: ${processed} processed, ${skipped} skipped, ${failed} failed, ${total} eligible`,
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
