import { BadRequestException, Injectable } from '@nestjs/common';

import { GeminiService } from '../gemini.service';
import type {
  DocumentExtractInput,
  DocumentExtractOutput,
} from '../types/ai.types';
import { DOCUMENT_EXTRACT_MAX_DOCUMENT_TEXT_CHARS } from './document-extract.constants';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import type { DocumentEntityType } from './dto/extract-document.dto';

@Injectable()
export class DocumentExtractService {
  constructor(
    private readonly documentTextExtractor: DocumentTextExtractorService,
    private readonly geminiService: GeminiService,
  ) {}

  async extractFromFile(
    file: Express.Multer.File,
    entityType: DocumentEntityType,
  ): Promise<DocumentExtractOutput> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('A document file is required');
    }

    const documentText = await this.documentTextExtractor.extractText(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    const truncatedText = documentText.slice(
      0,
      DOCUMENT_EXTRACT_MAX_DOCUMENT_TEXT_CHARS,
    );

    const input: DocumentExtractInput = {
      documentText: truncatedText,
      entityType,
    };

    return this.geminiService.generateDocumentExtract(input);
  }
}
