import { FileValidator } from '@nestjs/common';

import { DOCUMENT_EXTRACT_UNSUPPORTED_MESSAGE } from './document-extract.constants';
import { isAllowedDocumentExtractFile } from './document-extract-mime.util';

export class DocumentExtractFileValidator extends FileValidator<
  Record<string, never>
> {
  isValid(file?: Express.Multer.File): boolean {
    return Boolean(file && isAllowedDocumentExtractFile(file));
  }

  buildErrorMessage(): string {
    return DOCUMENT_EXTRACT_UNSUPPORTED_MESSAGE;
  }
}
