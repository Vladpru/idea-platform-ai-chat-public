import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiModule } from '../ai/ai.module';
import searchConfig from '../config/search.config';
import { EmbeddingModule } from '../embedding/embedding.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TagSuggestionService } from './tag-suggestion.service';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    EmbeddingModule,
    ConfigModule.forFeature(searchConfig),
  ],
  controllers: [TagController],
  providers: [TagService, TagSuggestionService],
  exports: [TagSuggestionService],
})
export class TagModule {}
