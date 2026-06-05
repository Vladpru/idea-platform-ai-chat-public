import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { DocumentExtractService } from './document/document-extract.service';
import { DocumentTextExtractorService } from './document/document-text-extractor.service';
import { DocxTextExtractorService } from './document/docx-text-extractor.service';
import { PdfTextExtractorService } from './document/pdf-text-extractor.service';
import { GeminiService } from './gemini.service';

@Module({
  controllers: [AiController],
  providers: [
    GeminiService,
    DocxTextExtractorService,
    PdfTextExtractorService,
    DocumentTextExtractorService,
    DocumentExtractService,
  ],
  exports: [GeminiService],
})
export class AiModule {}
