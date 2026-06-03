import { Module } from '@nestjs/common';

import { AiImageService } from './ai-image.service';
import { AiController } from './ai.controller';
import { GeminiImageService } from './gemini-image.service';
import { GeminiService } from './gemini.service';

@Module({
  controllers: [AiController],
  providers: [GeminiService, GeminiImageService, AiImageService],
  exports: [GeminiService, GeminiImageService, AiImageService],
})
export class AiModule {}
