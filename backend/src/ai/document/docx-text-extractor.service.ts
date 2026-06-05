import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';

@Injectable()
export class DocxTextExtractorService {
  async extractText(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }
}
