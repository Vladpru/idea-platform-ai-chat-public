import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import {
  DOCUMENT_EXTRACT_ALLOWED_MIME_REGEX,
  DOCUMENT_EXTRACT_FILE_TOO_LARGE_MESSAGE,
  DOCUMENT_EXTRACT_MAX_FILE_BYTES,
  DOCUMENT_EXTRACT_UNSUPPORTED_MESSAGE,
} from './document/document-extract.constants';
import { DocumentExtractService } from './document/document-extract.service';
import { DocumentEntityType } from './document/dto/extract-document.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly documentExtractService: DocumentExtractService,
  ) {}

  @Post('document-extract')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract form fields from an uploaded document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'entityType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: {
          type: 'string',
          enum: Object.values(DocumentEntityType),
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Extracted form fields from the uploaded document',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnsupportedMediaTypeResponse({
    description: DOCUMENT_EXTRACT_UNSUPPORTED_MESSAGE,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENT_EXTRACT_MAX_FILE_BYTES },
    }),
  )
  async extractDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: DOCUMENT_EXTRACT_MAX_FILE_BYTES,
            message: DOCUMENT_EXTRACT_FILE_TOO_LARGE_MESSAGE,
          }),
          new FileTypeValidator({
            fileType: DOCUMENT_EXTRACT_ALLOWED_MIME_REGEX,
          }),
        ],
        fileIsRequired: true,
        exceptionFactory: error => {
          if (error.includes('expected type')) {
            return new BadRequestException(
              DOCUMENT_EXTRACT_UNSUPPORTED_MESSAGE,
            );
          }
          if (error.includes('size')) {
            return new BadRequestException(
              DOCUMENT_EXTRACT_FILE_TOO_LARGE_MESSAGE,
            );
          }
          return new BadRequestException(error);
        },
      }),
    )
    file: Express.Multer.File,
    @Body('entityType') entityType: string,
  ) {
    if (entityType !== 'idea' && entityType !== 'problem') {
      throw new BadRequestException('entityType must be "idea" or "problem"');
    }

    const data = await this.documentExtractService.extractFromFile(
      file,
      entityType as DocumentEntityType,
    );

    return { data };
  }
}
