import { Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { IngestResponseDto } from './dto/ingest-response.dto';
import { IIngestionService, INGESTION_SERVICE } from './ingestion.interface';

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(
    @Inject(INGESTION_SERVICE)
    private readonly ingestionService: IIngestionService,
  ) {}

  @Post('ingest')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ingest knowledge source into the RAG knowledge base',
  })
  @ApiOkResponse({ type: IngestResponseDto })
  async ingest(): Promise<IngestResponseDto> {
    return this.ingestionService.ingestAll();
  }
}
