import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import embeddingConfig from '../config/embedding.config';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingSyncService } from './embedding-sync.service';
import { EmbeddingService } from './embedding.service';

@Module({
  imports: [ConfigModule.forFeature(embeddingConfig), PrismaModule],
  providers: [EmbeddingService, EmbeddingSyncService],
  exports: [EmbeddingService, EmbeddingSyncService],
})
export class EmbeddingModule {}
