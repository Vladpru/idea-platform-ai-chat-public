import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AchievementModule } from '../achievement/achievement.module';
import { CloudinaryModule } from '../../core/cloudinary/cloudinary.module';
import { EntityVisibilityModule } from '../entity-visibility/entity-visibility.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import {
  CommentActionsController,
  EntityCommentsController,
} from './comment.controller';
import { CommentService } from './comment.service';
import { CommentCreateThrottlerGuard } from './guards/comment-create-throttler.guard';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    EntityVisibilityModule,
    ThrottlerModule,
    AchievementModule,
  ],
  controllers: [EntityCommentsController, CommentActionsController],
  providers: [CommentService, CommentCreateThrottlerGuard],
  exports: [CommentService],
})
export class CommentModule {}
