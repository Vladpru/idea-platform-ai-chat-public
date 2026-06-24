import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { INGESTION_SERVICE } from './ingestion.interface';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { ObsidianIngestionService } from './obsidian-ingestion.service';
import { RagController } from './rag.controller';
import { VaultSyncCron } from './vault-sync.cron';
import { VaultSyncService } from './vault-sync.service';

@Module({
  imports: [PrismaModule, EmbeddingModule],
  controllers: [RagController],
  providers: [
    { provide: INGESTION_SERVICE, useClass: ObsidianIngestionService },
    ObsidianIngestionService,
    KnowledgeRetrievalService,
    VaultSyncService,
    VaultSyncCron,
  ],
  exports: [KnowledgeRetrievalService],
})
export class RagModule {}
