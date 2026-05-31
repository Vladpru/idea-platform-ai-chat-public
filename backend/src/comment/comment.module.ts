import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  CommentActionsController,
  EntityCommentsController,
} from './comment.controller';
import { CommentService } from './comment.service';
import { CommentCreateThrottlerGuard } from './guards/comment-create-throttler.guard';

@Module({
  imports: [PrismaModule, CloudinaryModule, ThrottlerModule],
  controllers: [EntityCommentsController, CommentActionsController],
  providers: [CommentService, CommentCreateThrottlerGuard],
  exports: [CommentService],
})
export class CommentModule {}
