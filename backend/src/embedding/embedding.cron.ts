import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { toPgVectorLiteral } from './vector.util';

@Injectable()
export class EmbeddingCron {
  private readonly logger = new Logger(EmbeddingCron.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Interval(30000)
  async processPendingEmbeddings(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const tables = ['idea', 'problem'] as const;

      for (const table of tables) {
        const records = await this.prisma.$queryRawUnsafe<
          { id: string; title: string | null; description: string | null }[]
        >(
          `SELECT id, title, description FROM "${table}" WHERE ai_embedding IS NULL LIMIT 10`,
        );

        for (const record of records) {
          const text = [record.title, record.description]
            .filter(Boolean)
            .join(' ')
            .trim();

          if (!text) {
            continue;
          }

          try {
            const vector = await this.embeddingService.embedText(text);
            const vectorLiteral = toPgVectorLiteral(vector);

            await this.prisma.$executeRawUnsafe(
              `UPDATE "${table}" SET ai_embedding = $1::vector WHERE id = $2::uuid`,
              vectorLiteral,
              record.id,
            );
          } catch (error) {
            this.logger.error(
              `Failed to embed ${table} ${record.id}`,
              error instanceof Error ? error.stack : String(error),
            );
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
