import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import similarityConfig from '../../core/config/similarity.config';
import { EmbeddingModule } from '../embedding/embedding.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SimilarityTextThrottlerGuard } from './guards/similarity-text-throttler.guard';
import { SimilarityController } from './similarity.controller';
import { SimilarityRepository } from './similarity.repository';
import { SimilarityService } from './similarity.service';

@Module({
  imports: [
    PrismaModule,
    EmbeddingModule,
    ConfigModule.forFeature(similarityConfig),
    ThrottlerModule,
  ],
  controllers: [SimilarityController],
  providers: [
    SimilarityRepository,
    SimilarityService,
    SimilarityTextThrottlerGuard,
  ],
  exports: [SimilarityRepository, SimilarityService],
})
export class SimilarityModule {}
