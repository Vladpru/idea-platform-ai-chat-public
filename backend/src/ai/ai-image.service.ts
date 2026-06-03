import { Injectable } from '@nestjs/common';

import { type GenerateImageDto } from './dto/generate-image.dto';
import { GeminiImageService } from './gemini-image.service';
import type {
  GenerateImageInput,
  GenerateImageOutput,
} from './types/generate-image.types';

@Injectable()
export class AiImageService {
  constructor(private readonly geminiImageService: GeminiImageService) {}

  async generateImage(dto: GenerateImageDto): Promise<GenerateImageOutput> {
    const input: GenerateImageInput = {
      prompt: dto.prompt,
      title: dto.title,
      description: dto.description,
      aspectRatio: dto.aspectRatio,
    };

    return await this.geminiImageService.generateContentImage(input);
  }
}
