import { Module } from '@nestjs/common';

import { AiSummaryModule } from '../ai-summary/ai-summary.module';
import { CloudinaryModule } from '../../core/cloudinary/cloudinary.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TagModule } from '../tag/tag.module';
import { ProblemMemberService } from './problem-member.service';
import { ProblemQueryService } from './problem-query.service';
import { ProblemSuggestedIdeasService } from './problem-suggested-ideas.service';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    EmbeddingModule,
    TagModule,
    AiSummaryModule,
    SubscriptionModule,
  ],
  controllers: [ProblemController],
  providers: [
    ProblemService,
    ProblemQueryService,
    ProblemSuggestedIdeasService,
    ProblemMemberService,
  ],
  exports: [
    ProblemService,
    ProblemQueryService,
    ProblemSuggestedIdeasService,
    ProblemMemberService,
  ],
})
export class ProblemModule {}
