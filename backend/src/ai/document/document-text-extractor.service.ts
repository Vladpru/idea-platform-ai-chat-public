import {
  BadRequestException,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

import {
  DOCUMENT_EXTRACT_PDF_NO_TEXT_MESSAGE,
  DOCUMENT_EXTRACT_UNREADABLE_MESSAGE,
  DOCUMENT_EXTRACT_UNSUPPORTED_MESSAGE,
} from './document-extract.constants';
import {
  DOCUMENT_EXTRACT_DOCX_MIME,
  DOCUMENT_EXTRACT_PDF_MIME,
  resolveDocumentExtractMimeType,
} from './document-extract-mime.util';
import { DocxTextExtractorService } from './docx-text-extractor.service';
import { PdfTextExtractorService } from './pdf-text-extractor.service';

@Injectable()
export class DocumentTextExtractorService {
  constructor(
    private readonly docxExtractor: DocxTextExtractorService,
    private readonly pdfExtractor: PdfTextExtractorService,
  ) {}

  async extractText(
    buffer: Buffer,
    mimeType: string,
    originalFilename?: string,
  ): Promise<string> {
    const normalizedMime = resolveDocumentExtractMimeType(
      mimeType,
      originalFilename,
    );

    if (!normalizedMime) {
      throw new UnsupportedMediaTypeException(
        DOCUMENT_EXTRACT_UNSUPPORTED_MESSAGE,
      );
    }

    try {
      const extractedText =
        normalizedMime === DOCUMENT_EXTRACT_DOCX_MIME
          ? await this.docxExtractor.extractText(buffer)
          : await this.pdfExtractor.extractText(buffer);
      const text = extractedText.trim();

      if (!text) {
        throw new BadRequestException(
          normalizedMime === DOCUMENT_EXTRACT_PDF_MIME
            ? DOCUMENT_EXTRACT_PDF_NO_TEXT_MESSAGE
            : DOCUMENT_EXTRACT_UNREADABLE_MESSAGE,
        );
      }

      return text;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnsupportedMediaTypeException
      ) {
        throw error;
      }

      const message =
        error instanceof Error &&
        error.message === DOCUMENT_EXTRACT_PDF_NO_TEXT_MESSAGE
          ? DOCUMENT_EXTRACT_PDF_NO_TEXT_MESSAGE
          : DOCUMENT_EXTRACT_UNREADABLE_MESSAGE;

      throw new BadRequestException(message);
    }
  }
}
