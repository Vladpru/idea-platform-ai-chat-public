import { Module } from '@nestjs/common';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProblemQueryService } from './problem-query.service';
import { ProblemSuggestedIdeasService } from './problem-suggested-ideas.service';
import { ProblemSuggestedTagsService } from './problem-suggested-tags.service';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';

@Module({
  imports: [PrismaModule, CloudinaryModule, EmbeddingModule],
  controllers: [ProblemController],
  providers: [
    ProblemService,
    ProblemQueryService,
    ProblemSuggestedIdeasService,
    ProblemSuggestedTagsService,
  ],
  exports: [
    ProblemService,
    ProblemQueryService,
    ProblemSuggestedIdeasService,
    ProblemSuggestedTagsService,
  ],
})
export class ProblemModule {}
