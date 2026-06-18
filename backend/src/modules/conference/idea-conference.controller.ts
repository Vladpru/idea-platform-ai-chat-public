import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { EntityTarget } from '../entity-visibility/entity-target.enum';
import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { ConferenceService } from './conference.service';
import {
  CreateConferenceDto,
  CreateConferenceInviteDto,
  GetSuggestedSpeakersQueryDto,
  UpdateConferenceDto,
} from './dto';
import type { ConferenceInviteDto } from './types/conference-invite.types';
import type {
  ConferenceDto,
  ConferenceListResponse,
  JoinConferenceResponse,
  SuggestedSpeakersResponse,
} from './types/conference.types';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('idea-conferences')
@Controller('ideas/:ideaId/conferences')
@JwtAuth()
@ApiBearerAuth()
export class IdeaConferenceController {
  constructor(private readonly conferenceService: ConferenceService) {}

  @Get('suggested-speakers')
  @ApiOperation({ summary: 'List suggested speakers for an idea conference' })
  @ApiOkResponse({ description: 'Suggested speakers' })
  @ApiNotFoundResponse({ description: 'Idea or conference not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getSuggestedSpeakers(
    @Param('ideaId', ParseUUIDPipe) ideaId: string,
    @Query() query: GetSuggestedSpeakersQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuggestedSpeakersResponse> {
    return this.conferenceService.getSuggestedSpeakers(
      EntityTarget.IDEA,
      ideaId,
      req.user.id,
      query.conferenceId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List conferences for an idea' })
  @ApiOkResponse({ description: 'Conference list' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  listConferences(
    @Param('ideaId', ParseUUIDPipe) ideaId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceListResponse> {
    return this.conferenceService.listByEntity(
      EntityTarget.IDEA,
      ideaId,
      req.user.id,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a conference for an idea' })
  @ApiCreatedResponse({ description: 'Scheduled conference' })
  @ApiForbiddenResponse({ description: 'Only the idea author can schedule' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  scheduleConference(
    @Param('ideaId', ParseUUIDPipe) ideaId: string,
    @Body() dto: CreateConferenceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceDto> {
    return this.conferenceService.schedule(
      EntityTarget.IDEA,
      ideaId,
      req.user.id,
      dto,
    );
  }

  @Post(':conferenceId/invites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a speaker to a conference' })
  @ApiCreatedResponse({ description: 'Conference invite' })
  @ApiForbiddenResponse({ description: 'Only the idea author can invite' })
  @ApiNotFoundResponse({ description: 'Idea or conference not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  inviteSpeaker(
    @Param('ideaId', ParseUUIDPipe) ideaId: string,
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @Body() dto: CreateConferenceInviteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceInviteDto> {
    return this.conferenceService.inviteSpeaker(
      EntityTarget.IDEA,
      ideaId,
      conferenceId,
      req.user.id,
      dto,
    );
  }

  @Post(':conferenceId/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Join a live conference and receive a LiveKit token',
  })
  @ApiOkResponse({ description: 'LiveKit join credentials' })
  @ApiNotFoundResponse({ description: 'Idea or conference not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Conference is not live' })
  joinConference(
    @Param('ideaId', ParseUUIDPipe) ideaId: string,
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<JoinConferenceResponse> {
    return this.conferenceService.joinConference(
      EntityTarget.IDEA,
      ideaId,
      conferenceId,
      req.user.id,
    );
  }

  @Patch(':conferenceId')
  @ApiOperation({ summary: 'Start, end, or cancel a conference' })
  @ApiOkResponse({ description: 'Updated conference' })
  @ApiForbiddenResponse({ description: 'Only the idea author can update' })
  @ApiNotFoundResponse({ description: 'Idea or conference not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  updateConference(
    @Param('ideaId', ParseUUIDPipe) ideaId: string,
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @Body() dto: UpdateConferenceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceDto> {
    return this.conferenceService.updateStatus(
      EntityTarget.IDEA,
      ideaId,
      conferenceId,
      req.user.id,
      dto.action,
    );
  }
}
