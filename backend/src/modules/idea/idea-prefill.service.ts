import { Injectable } from '@nestjs/common';

import { GeminiService } from '../ai/gemini.service';
import {
  type GenerateIdeaPrefillDto,
  type IdeaPrefillDataDto,
} from './dto/generate-idea-prefill.dto';

@Injectable()
export class IdeaPrefillService {
  constructor(private readonly geminiService: GeminiService) {}

  async generatePrefill(
    dto: GenerateIdeaPrefillDto,
  ): Promise<IdeaPrefillDataDto> {
    return this.geminiService.generateIdeaPrefill({
      mode: dto.mode,
      userPrompt: dto.userPrompt,
      title: dto.title,
      description: dto.description,
    });
  }
}
