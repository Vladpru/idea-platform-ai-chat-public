import { Module } from '@nestjs/common';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IdeaMediaService } from './idea-media.service';
import { IdeaMemberService } from './idea-member.service';
import { IdeaQueryService } from './idea-query.service';
import { IdeaController } from './idea.controller';
import { IdeaService } from './idea.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [IdeaController],
  providers: [IdeaService, IdeaMediaService, IdeaQueryService, IdeaMemberService],
  exports: [IdeaService, IdeaMediaService, IdeaQueryService, IdeaMemberService],
})
export class IdeaModule {}
