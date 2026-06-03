import { Module } from '@nestjs/common';

import { EmbeddingModule } from '../embedding/embedding.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [EmbeddingModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
