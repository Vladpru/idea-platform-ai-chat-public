import { Module } from '@nestjs/common';

import { AiImageController } from './ai-image.controller';
import { AiImageService } from './ai-image.service';
import { DeapiImageService } from './deapi/deapi-image.service';

@Module({
  controllers: [AiImageController],
  providers: [DeapiImageService, AiImageService],
  exports: [AiImageService, DeapiImageService],
})
export class AiImageModule {}
