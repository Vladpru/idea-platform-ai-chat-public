import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { PdfService } from './pdf.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('pdf')
@Controller()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('ideas/:id/export-pdf')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger PDF export for an idea' })
  @ApiAcceptedResponse({ description: 'PDF generation queued' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  async exportIdea(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.pdfService.enqueueIdeaExport(id, req.user.id);
    return { message: "PDF is being generated, you'll be notified when ready" };
  }

  @Post('problems/:id/export-pdf')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger PDF export for a problem' })
  @ApiAcceptedResponse({ description: 'PDF generation queued' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  async exportProblem(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.pdfService.enqueueProblemExport(id, req.user.id);
    return { message: "PDF is being generated, you'll be notified when ready" };
  }
}
