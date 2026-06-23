import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { IngestResponseDto } from './dto/ingest-response.dto';
import { ObsidianIngestionService } from './obsidian-ingestion.service';

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(
    private readonly obsidianIngestionService: ObsidianIngestionService,
  ) {}

  @Post('ingest')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ingest Obsidian vault into the RAG knowledge base',
  })
  @ApiOkResponse({ type: IngestResponseDto })
  async ingest(): Promise<IngestResponseDto> {
    return this.obsidianIngestionService.ingestAll();
  }
}
