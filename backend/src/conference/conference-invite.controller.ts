import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { ConferenceInviteService } from './conference-invite.service';
import {
  AcceptConferenceInviteDto,
  PreviewConferenceInviteQueryDto,
} from './dto';
import type {
  ConferenceInviteDto,
  ConferenceInvitePreviewDto,
} from './types/conference-invite.types';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('conference-invites')
@Controller('conference-invites')
export class ConferenceInviteController {
  constructor(
    private readonly conferenceInviteService: ConferenceInviteService,
  ) {}

  @Get('preview')
  @ApiOperation({ summary: 'Preview an external conference invite' })
  @ApiOkResponse({ description: 'Conference invite preview metadata' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  previewInvite(
    @Query() query: PreviewConferenceInviteQueryDto,
  ): Promise<ConferenceInvitePreviewDto> {
    return this.conferenceInviteService.previewInvite(query.token);
  }

  @Post('accept')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept an external conference invite' })
  @ApiOkResponse({ description: 'Accepted conference invite' })
  @ApiForbiddenResponse({ description: 'Invite email does not match account' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  acceptInvite(
    @Body() dto: AcceptConferenceInviteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceInviteDto> {
    return this.conferenceInviteService.acceptInvite(dto.token, req.user.id);
  }
}
