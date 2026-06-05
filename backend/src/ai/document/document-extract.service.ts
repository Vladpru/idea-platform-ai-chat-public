import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { GeminiService } from '../gemini.service';
import type {
  DocumentExtractInput,
  DocumentExtractResult,
} from '../types/ai.types';
import { DOCUMENT_EXTRACT_MAX_DOCUMENT_TEXT_CHARS } from './document-extract.constants';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import type { DocumentEntityType } from './dto/extract-document.dto';

@Injectable()
export class DocumentExtractService {
  private readonly logger = new Logger(DocumentExtractService.name);

  constructor(
    private readonly documentTextExtractor: DocumentTextExtractorService,
    private readonly geminiService: GeminiService,
  ) {}

  async extractFromFile(
    file: Express.Multer.File,
    entityType: DocumentEntityType,
  ): Promise<DocumentExtractResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('A document file is required');
    }

    const documentText = await this.documentTextExtractor.extractText(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    const documentTextTruncated =
      documentText.length > DOCUMENT_EXTRACT_MAX_DOCUMENT_TEXT_CHARS;
    const truncatedText = documentText.slice(
      0,
      DOCUMENT_EXTRACT_MAX_DOCUMENT_TEXT_CHARS,
    );

    if (documentTextTruncated) {
      this.logger.warn(
        `Document text truncated from ${documentText.length} to ${DOCUMENT_EXTRACT_MAX_DOCUMENT_TEXT_CHARS} chars (${file.originalname})`,
      );
    }

    const input: DocumentExtractInput = {
      documentText: truncatedText,
      entityType,
    };

    const data = await this.geminiService.generateDocumentExtract(input);

    return {
      data,
      meta: { documentTextTruncated },
    };
  }
}
