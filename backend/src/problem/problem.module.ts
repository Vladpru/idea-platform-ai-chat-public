import { Module } from '@nestjs/common';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProblemQueryService } from './problem-query.service';
import { ProblemSuggestedIdeasService } from './problem-suggested-ideas.service';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [ProblemController],
  providers: [
    ProblemService,
    ProblemQueryService,
    ProblemSuggestedIdeasService,
  ],
  exports: [ProblemService, ProblemQueryService, ProblemSuggestedIdeasService],
})
export class ProblemModule {}
