import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingSyncService } from './embedding-sync.service';
import { EmbeddingService } from './embedding.service';

@Module({
  imports: [PrismaModule],
  providers: [EmbeddingService, EmbeddingSyncService],
  exports: [EmbeddingService, EmbeddingSyncService],
})
export class EmbeddingModule {}
