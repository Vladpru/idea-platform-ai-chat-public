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
import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
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

@ApiTags('problem-conferences')
@Controller('problems/:problemId/conferences')
@JwtAuth()
@ApiBearerAuth()
export class ProblemConferenceController {
  constructor(private readonly conferenceService: ConferenceService) {}

  @Get('suggested-speakers')
  @ApiOperation({
    summary: 'List suggested speakers for a problem conference',
  })
  @ApiOkResponse({ description: 'Suggested speakers' })
  @ApiNotFoundResponse({ description: 'Problem or conference not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getSuggestedSpeakers(
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @Query() query: GetSuggestedSpeakersQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuggestedSpeakersResponse> {
    return this.conferenceService.getSuggestedSpeakers(
      EntityTarget.PROBLEM,
      problemId,
      req.user.id,
      query.conferenceId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List conferences for a problem' })
  @ApiOkResponse({ description: 'Conference list' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  listConferences(
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceListResponse> {
    return this.conferenceService.listByEntity(
      EntityTarget.PROBLEM,
      problemId,
      req.user.id,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a conference for a problem' })
  @ApiCreatedResponse({ description: 'Scheduled conference' })
  @ApiForbiddenResponse({ description: 'Only the problem author can schedule' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  scheduleConference(
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @Body() dto: CreateConferenceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceDto> {
    return this.conferenceService.schedule(
      EntityTarget.PROBLEM,
      problemId,
      req.user.id,
      dto,
    );
  }

  @Post(':conferenceId/invites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a speaker to a conference' })
  @ApiCreatedResponse({ description: 'Conference invite' })
  @ApiForbiddenResponse({ description: 'Only the problem author can invite' })
  @ApiNotFoundResponse({ description: 'Problem or conference not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  inviteSpeaker(
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @Body() dto: CreateConferenceInviteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceInviteDto> {
    return this.conferenceService.inviteSpeaker(
      EntityTarget.PROBLEM,
      problemId,
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
  @ApiNotFoundResponse({ description: 'Problem or conference not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Conference is not live' })
  joinConference(
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<JoinConferenceResponse> {
    return this.conferenceService.joinConference(
      EntityTarget.PROBLEM,
      problemId,
      conferenceId,
      req.user.id,
    );
  }

  @Patch(':conferenceId')
  @ApiOperation({ summary: 'Start, end, or cancel a conference' })
  @ApiOkResponse({ description: 'Updated conference' })
  @ApiForbiddenResponse({ description: 'Only the problem author can update' })
  @ApiNotFoundResponse({ description: 'Problem or conference not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  updateConference(
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @Body() dto: UpdateConferenceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConferenceDto> {
    return this.conferenceService.updateStatus(
      EntityTarget.PROBLEM,
      problemId,
      conferenceId,
      req.user.id,
      dto.action,
    );
  }
}
