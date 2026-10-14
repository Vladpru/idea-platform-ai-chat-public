import {
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { IngestResponseDto } from './dto/ingest-response.dto';
import { ReindexEntitiesResponseDto } from './dto/reindex-entities-response.dto';
import { EntityChunkSyncService } from './entity-chunk-sync.service';
import { IIngestionService, INGESTION_SERVICE } from './ingestion.interface';

type AuthenticatedRequest = Request & {
  user: { id: string; role: 'ADMIN' | 'MEMBER' };
};

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(
    @Inject(INGESTION_SERVICE)
    private readonly ingestionService: IIngestionService,
    private readonly entityChunkSyncService: EntityChunkSyncService,
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

  @Post('reindex-entities')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Re-index all idea and problem chunks in the knowledge base',
  })
  @ApiOkResponse({ type: ReindexEntitiesResponseDto })
  @ApiForbiddenResponse({ description: 'Admin only' })
  async reindexEntities(
    @Req() req: AuthenticatedRequest,
  ): Promise<ReindexEntitiesResponseDto> {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }
    return this.entityChunkSyncService.reconcileAll();
  }
}
