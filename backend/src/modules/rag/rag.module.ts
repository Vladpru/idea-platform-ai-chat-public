import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { EntityChunkSyncService } from './entity-chunk-sync.service';
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
    ObsidianIngestionService,
    { provide: INGESTION_SERVICE, useExisting: ObsidianIngestionService },
    KnowledgeRetrievalService,
    VaultSyncService,
    VaultSyncCron,
    EntityChunkSyncService,
  ],
  exports: [KnowledgeRetrievalService, EntityChunkSyncService],
})
export class RagModule {}
