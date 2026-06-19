import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import searchConfig from '../../core/config/search.config';
import { EmbeddingModule } from '../embedding/embedding.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [ConfigModule.forFeature(searchConfig), EmbeddingModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
