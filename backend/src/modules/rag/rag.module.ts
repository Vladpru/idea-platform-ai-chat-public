import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { ObsidianIngestionService } from './obsidian-ingestion.service';
import { RagController } from './rag.controller';
import { VaultSyncCron } from './vault-sync.cron';
import { VaultSyncService } from './vault-sync.service';

@Module({
  imports: [PrismaModule, EmbeddingModule],
  controllers: [RagController],
  providers: [
    ObsidianIngestionService,
    KnowledgeRetrievalService,
    VaultSyncService,
    VaultSyncCron,
  ],
  exports: [KnowledgeRetrievalService],
})
export class RagModule {}
