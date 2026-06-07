import { Module } from '@nestjs/common';

import { AiSummaryModule } from '../ai-summary/ai-summary.module';
import { AiModule } from '../ai/ai.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IdeaMediaService } from './idea-media.service';
import { IdeaMemberService } from './idea-member.service';
import { IdeaPrefillService } from './idea-prefill.service';
import { IdeaQueryService } from './idea-query.service';
import { IdeaController } from './idea.controller';
import { IdeaService } from './idea.service';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    AiModule,
    EmbeddingModule,
    AiSummaryModule,
  ],
  controllers: [IdeaController],
  providers: [
    IdeaService,
    IdeaMediaService,
    IdeaQueryService,
    IdeaMemberService,
    IdeaPrefillService,
  ],
  exports: [
    IdeaService,
    IdeaMediaService,
    IdeaQueryService,
    IdeaMemberService,
    IdeaPrefillService,
  ],
})
export class IdeaModule {}
