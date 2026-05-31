import { Module } from '@nestjs/common';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  CommentActionsController,
  IdeaCommentsController,
  ProblemCommentsController,
} from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [
    IdeaCommentsController,
    ProblemCommentsController,
    CommentActionsController,
  ],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
