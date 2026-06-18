import { Injectable } from '@nestjs/common';

import { type GenerateImageDto } from '../ai/dto/generate-image.dto';
import type {
  GenerateImageInput,
  GenerateImageOutput,
} from '../ai/types/generate-image.types';
import { DeapiImageService } from './deapi/deapi-image.service';

@Injectable()
export class AiImageService {
  constructor(private readonly deapiImageService: DeapiImageService) {}

  async generateImage(dto: GenerateImageDto): Promise<GenerateImageOutput> {
    const input: GenerateImageInput = {
      prompt: dto.prompt,
      title: dto.title,
      description: dto.description,
      aspectRatio: dto.aspectRatio,
    };

    return await this.deapiImageService.generateImage(input);
  }
}
