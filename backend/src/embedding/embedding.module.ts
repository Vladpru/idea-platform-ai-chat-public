import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiModule } from '../ai/ai.module';
import embeddingConfig from '../config/embedding.config';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingCron } from './embedding.cron';
import { EmbeddingService } from './embedding.service';
import { EntityEmbeddingSyncService } from './entity-embedding-sync.service';

@Module({
  imports: [ConfigModule.forFeature(embeddingConfig), PrismaModule, AiModule],
  providers: [EmbeddingService, EntityEmbeddingSyncService, EmbeddingCron],
  exports: [EmbeddingService, EntityEmbeddingSyncService, EmbeddingCron],
})
export class EmbeddingModule {}
