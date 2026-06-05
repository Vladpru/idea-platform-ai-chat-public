import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

import { DOCUMENT_EXTRACT_PDF_NO_TEXT_MESSAGE } from './document-extract.constants';

@Injectable()
export class PdfTextExtractorService {
  async extractText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const text = result.text.trim();

      if (!text) {
        throw new Error(DOCUMENT_EXTRACT_PDF_NO_TEXT_MESSAGE);
      }

      return text;
    } finally {
      await parser.destroy();
    }
  }
}
