import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import embeddingConfig from '../config/embedding.config';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingCron } from './embedding.cron';
import { EmbeddingService } from './embedding.service';

@Module({
  imports: [ConfigModule.forFeature(embeddingConfig), PrismaModule],
  providers: [EmbeddingService, EmbeddingCron],
  exports: [EmbeddingService, EmbeddingCron],
})
export class EmbeddingModule {}
