import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { ObsidianIngestionService } from './obsidian-ingestion.service';
import { RagController } from './rag.controller';

@Module({
  imports: [PrismaModule, EmbeddingModule],
  controllers: [RagController],
  providers: [ObsidianIngestionService, KnowledgeRetrievalService],
  exports: [KnowledgeRetrievalService],
})
export class RagModule {}
