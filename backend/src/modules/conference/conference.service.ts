import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  type ConferenceInviteStatus,
  ConferenceStatus,
} from '../../../generated/prisma/client';
import type { EntityLinkTarget } from '../entity-visibility/entity-target.enum';
import { EntityVisibilityService } from '../entity-visibility/entity-visibility.service';
import { formatAuthorDisplayName } from '../live-chat/live-chat.mapper';
import { LivekitRoomService } from '../../core/livekit/livekit-room.service';
import { LivekitTokenService } from '../../core/livekit/livekit-token.service';
import { LIVEKIT_ROOM_EMPTY_TIMEOUT_SECONDS } from '../../core/livekit/livekit.constants';
import { isUniqueConstraintError } from '../../shared/utils/is-unique-error.util';
import {
  CONFERENCE_INVITE_CANNOT_INVITE_AUTHOR,
  CONFERENCE_INVITE_CONFERENCE_CLOSED,
  CONFERENCE_INVITE_INVALID_TARGET,
} from './conference-invite.constants';
import { ConferenceInviteService } from './conference-invite.service';
import {
  CONFERENCE_ALREADY_LIVE,
  CONFERENCE_AUTHOR_ONLY,
  CONFERENCE_INVALID_SPEAKERS,
  CONFERENCE_NOT_FOUND,
  CONFERENCE_NOT_LIVE,
  CONFERENCE_NOT_SCHEDULED,
  CONFERENCE_SCHEDULED_FOR_PAST,
} from './conference.constants';
import {
  buildConferenceProviderRoomName,
  mapInviteStateByUserId,
  toConferenceResponse,
  toInviteState,
  toSuggestedSpeakerResponse,
} from './conference.mapper';
import { ConferenceRepository } from './conference.repository';
import type { CreateConferenceInviteDto } from './dto/create-conference-invite.dto';
import type { CreateConferenceDto } from './dto/create-conference.dto';
import type { ConferenceUpdateAction } from './dto/update-conference.dto';
import type { ConferenceInviteDto } from './types/conference-invite.types';
import type {
  ConferenceDto,
  ConferenceListResponse,
  ConferenceRole,
  JoinConferenceResponse,
  SuggestedSpeakersResponse,
} from './types/conference.types';

@Injectable()
export class ConferenceService {
  constructor(
    private readonly conferenceRepository: ConferenceRepository,
    private readonly entityVisibility: EntityVisibilityService,
    private readonly livekitRoomService: LivekitRoomService,
    private readonly livekitTokenService: LivekitTokenService,
    private readonly conferenceInviteService: ConferenceInviteService,
  ) {}

  async schedule(
    target: EntityLinkTarget,
    entityId: string,
    userId: string,
    dto: CreateConferenceDto,
  ): Promise<ConferenceDto> {
    await this.assertEntityAuthor(target, entityId, userId);

    const scheduledDate = new Date(dto.scheduledFor);

    if (Number.isNaN(scheduledDate.getTime())) {
      throw new BadRequestException(CONFERENCE_SCHEDULED_FOR_PAST);
    }

    if (scheduledDate.getTime() <= Date.now()) {
      throw new BadRequestException(CONFERENCE_SCHEDULED_FOR_PAST);
    }

    const speakerUserIds = await this.resolveSpeakerUserIds(
      target,
      entityId,
      dto.speakerUserIds ?? [],
    );

    const conference =
      await this.conferenceRepository.createConferenceWithInvites({
        target,
        entityId,
        scheduledById: userId,
        title: dto.title,
        description: dto.description ?? null,
        scheduledFor: scheduledDate,
        speakerUserIds,
        invitedById: userId,
      });

    return toConferenceResponse(conference);
  }

  async listByEntity(
    target: EntityLinkTarget,
    entityId: string,
    userId: string,
  ): Promise<ConferenceListResponse> {
    await this.entityVisibility.getVisibleEntity(target, entityId, userId);

    const conferences = await this.conferenceRepository.findManyByEntity(
      target,
      entityId,
    );

    return {
      conferences: conferences.map(toConferenceResponse),
    };
  }

  async getSuggestedSpeakers(
    target: EntityLinkTarget,
    entityId: string,
    userId: string,
    conferenceId?: string,
  ): Promise<SuggestedSpeakersResponse> {
    await this.entityVisibility.getVisibleEntity(target, entityId, userId);

    const team = await this.conferenceRepository.findEntityTeam(
      target,
      entityId,
    );

    if (!team) {
      throw new NotFoundException(CONFERENCE_NOT_FOUND);
    }

    const resolvedConferenceId = await this.resolveConferenceIdForSpeakers(
      target,
      entityId,
      conferenceId,
    );

    const inviteStateByUserId = resolvedConferenceId
      ? mapInviteStateByUserId(
          await this.conferenceRepository.findInvitesByConferenceId(
            resolvedConferenceId,
          ),
        )
      : new Map<string, ConferenceInviteStatus>();

    const speakers = [
      toSuggestedSpeakerResponse({
        user: team.author,
        roleLabel: 'Author',
        inviteState: 'not_invited',
      }),
      ...team.members.map(member =>
        toSuggestedSpeakerResponse({
          user: member,
          roleLabel: 'Team member',
          inviteState: toInviteState(inviteStateByUserId.get(member.id)),
        }),
      ),
    ];

    return {
      conferenceId: resolvedConferenceId,
      speakers,
    };
  }

  async inviteSpeaker(
    target: EntityLinkTarget,
    entityId: string,
    conferenceId: string,
    userId: string,
    dto: CreateConferenceInviteDto,
  ): Promise<ConferenceInviteDto> {
    await this.assertEntityAuthor(target, entityId, userId);

    const conference = await this.findConferenceForMutation(
      target,
      entityId,
      conferenceId,
    );

    this.assertInviteTarget(dto);

    if (dto.userId) {
      const authorId = await this.conferenceRepository.findEntityAuthorId(
        target,
        entityId,
      );

      if (dto.userId === authorId) {
        throw new BadRequestException(CONFERENCE_INVITE_CANNOT_INVITE_AUTHOR);
      }

      await this.conferenceInviteService.assertUserExists(dto.userId);

      return this.conferenceInviteService.invitePlatformUser(
        conference.id,
        userId,
        dto.userId,
      );
    }

    return this.conferenceInviteService.inviteByEmail(
      conference.id,
      userId,
      dto.email!,
    );
  }

  async joinConference(
    target: EntityLinkTarget,
    entityId: string,
    conferenceId: string,
    userId: string,
  ): Promise<JoinConferenceResponse> {
    await this.entityVisibility.getVisibleEntity(target, entityId, userId);

    const conference = await this.conferenceRepository.findById(
      conferenceId,
      target,
      entityId,
    );

    if (!conference) {
      throw new NotFoundException(CONFERENCE_NOT_FOUND);
    }

    if (conference.status !== ConferenceStatus.LIVE) {
      throw new BadRequestException(CONFERENCE_NOT_LIVE);
    }

    if (!conference.providerRoomName) {
      throw new BadRequestException(CONFERENCE_NOT_LIVE);
    }

    const participant = await this.conferenceRepository.findUserAuthor(userId);

    if (!participant) {
      throw new NotFoundException(CONFERENCE_NOT_FOUND);
    }

    const role = await this.resolveConferenceRole(
      target,
      entityId,
      conference.id,
      userId,
    );
    const canPublish = role === 'speaker';

    const token = await this.livekitTokenService.mintRoomToken({
      identity: userId,
      name: formatAuthorDisplayName(participant),
      providerRoomName: conference.providerRoomName,
      canPublish,
      canSubscribe: true,
      canPublishData: true,
    });

    return {
      token,
      livekitUrl: this.livekitTokenService.getLivekitUrl(),
      role,
      conference: toConferenceResponse(conference),
    };
  }

  async handleRoomFinished(providerRoomName: string): Promise<void> {
    const conference =
      await this.conferenceRepository.findByProviderRoomName(providerRoomName);

    if (!conference || conference.status !== ConferenceStatus.LIVE) {
      return;
    }

    await this.conferenceRepository.updateStatus(conference.id, {
      status: ConferenceStatus.ENDED,
      endedAt: new Date(),
    });
  }

  async updateStatus(
    target: EntityLinkTarget,
    entityId: string,
    conferenceId: string,
    userId: string,
    action: ConferenceUpdateAction,
  ): Promise<ConferenceDto> {
    if (action === 'end') {
      await this.assertAuthorOrSpeaker(target, entityId, conferenceId, userId);
    } else {
      await this.assertEntityAuthor(target, entityId, userId);
    }

    const conference = await this.conferenceRepository.findById(
      conferenceId,
      target,
      entityId,
    );

    if (!conference) {
      throw new NotFoundException(CONFERENCE_NOT_FOUND);
    }

    switch (action) {
      case 'start':
        return this.startConference(target, entityId, conference);
      case 'end':
        return this.endConference(conference);
      case 'cancel':
        return this.cancelConference(conference);
      default:
        throw new BadRequestException('Invalid conference action');
    }
  }

  private async startConference(
    target: EntityLinkTarget,
    entityId: string,
    conference: NonNullable<
      Awaited<ReturnType<ConferenceRepository['findById']>>
    >,
  ): Promise<ConferenceDto> {
    if (conference.status !== ConferenceStatus.SCHEDULED) {
      throw new BadRequestException(CONFERENCE_NOT_SCHEDULED);
    }

    const existingLive = await this.conferenceRepository.findLiveConference(
      target,
      entityId,
    );

    if (existingLive && existingLive.id !== conference.id) {
      throw new ConflictException(CONFERENCE_ALREADY_LIVE);
    }

    const startedAt = new Date();
    const providerRoomName = buildConferenceProviderRoomName(conference.id);

    let updatedConference;

    try {
      updatedConference = await this.conferenceRepository.updateStatus(
        conference.id,
        {
          status: ConferenceStatus.LIVE,
          startedAt,
          providerRoomName,
        },
      );
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      throw new ConflictException(CONFERENCE_ALREADY_LIVE);
    }

    try {
      await this.livekitRoomService.createRoom(
        providerRoomName,
        LIVEKIT_ROOM_EMPTY_TIMEOUT_SECONDS,
      );
    } catch (error) {
      await this.conferenceRepository
        .updateStatus(conference.id, {
          status: ConferenceStatus.SCHEDULED,
          startedAt: null,
          providerRoomName: null,
        })
        .catch(() => undefined);

      throw error;
    }

    return toConferenceResponse(updatedConference);
  }

  private async endConference(
    conference: NonNullable<
      Awaited<ReturnType<ConferenceRepository['findById']>>
    >,
  ): Promise<ConferenceDto> {
    if (conference.status !== ConferenceStatus.LIVE) {
      throw new BadRequestException(CONFERENCE_NOT_LIVE);
    }

    if (conference.providerRoomName) {
      await this.livekitRoomService
        .deleteRoom(conference.providerRoomName)
        .catch(() => undefined);
    }

    const updatedConference = await this.conferenceRepository.updateStatus(
      conference.id,
      {
        status: ConferenceStatus.ENDED,
        endedAt: new Date(),
      },
    );

    return toConferenceResponse(updatedConference);
  }

  private async cancelConference(
    conference: NonNullable<
      Awaited<ReturnType<ConferenceRepository['findById']>>
    >,
  ): Promise<ConferenceDto> {
    if (conference.status !== ConferenceStatus.SCHEDULED) {
      throw new BadRequestException(CONFERENCE_NOT_SCHEDULED);
    }

    const updatedConference = await this.conferenceRepository.updateStatus(
      conference.id,
      {
        status: ConferenceStatus.CANCELLED,
        endedAt: new Date(),
      },
    );

    return toConferenceResponse(updatedConference);
  }

  private async assertEntityAuthor(
    target: EntityLinkTarget,
    entityId: string,
    userId: string,
  ): Promise<void> {
    const authorId = await this.conferenceRepository.findEntityAuthorId(
      target,
      entityId,
    );

    if (!authorId) {
      throw new NotFoundException(CONFERENCE_NOT_FOUND);
    }

    if (authorId !== userId) {
      throw new ForbiddenException(CONFERENCE_AUTHOR_ONLY);
    }
  }

  private async assertAuthorOrSpeaker(
    target: EntityLinkTarget,
    entityId: string,
    conferenceId: string,
    userId: string,
  ): Promise<void> {
    const authorId = await this.conferenceRepository.findEntityAuthorId(
      target,
      entityId,
    );

    if (!authorId) {
      throw new NotFoundException(CONFERENCE_NOT_FOUND);
    }

    if (authorId === userId) {
      return;
    }

    const hasInvite = await this.conferenceInviteService.hasInvite(
      conferenceId,
      userId,
    );

    if (!hasInvite) {
      throw new ForbiddenException(CONFERENCE_AUTHOR_ONLY);
    }
  }

  private async resolveSpeakerUserIds(
    target: EntityLinkTarget,
    entityId: string,
    speakerUserIds: string[],
  ): Promise<string[]> {
    if (speakerUserIds.length === 0) {
      return [];
    }

    const team = await this.conferenceRepository.findEntityTeam(
      target,
      entityId,
    );

    if (!team) {
      throw new NotFoundException(CONFERENCE_NOT_FOUND);
    }

    const teamUserIds = new Set([
      team.authorId,
      ...team.members.map(member => member.id),
    ]);

    const uniqueSpeakerIds = [...new Set(speakerUserIds)].filter(
      id => id !== team.authorId,
    );

    if (uniqueSpeakerIds.some(id => !teamUserIds.has(id))) {
      throw new BadRequestException(CONFERENCE_INVALID_SPEAKERS);
    }

    return uniqueSpeakerIds;
  }

  private async resolveConferenceIdForSpeakers(
    target: EntityLinkTarget,
    entityId: string,
    conferenceId?: string,
  ): Promise<string | null> {
    if (conferenceId) {
      const conference = await this.conferenceRepository.findById(
        conferenceId,
        target,
        entityId,
      );

      if (!conference) {
        throw new NotFoundException(CONFERENCE_NOT_FOUND);
      }

      return conference.id;
    }

    const liveConference = await this.conferenceRepository.findLiveConference(
      target,
      entityId,
    );

    if (liveConference) {
      return liveConference.id;
    }

    const nextScheduled =
      await this.conferenceRepository.findNextScheduledConference(
        target,
        entityId,
      );

    return nextScheduled?.id ?? null;
  }

  private async findConferenceForMutation(
    target: EntityLinkTarget,
    entityId: string,
    conferenceId: string,
  ) {
    const conference = await this.conferenceRepository.findById(
      conferenceId,
      target,
      entityId,
    );

    if (!conference) {
      throw new NotFoundException(CONFERENCE_NOT_FOUND);
    }

    if (
      conference.status === ConferenceStatus.ENDED ||
      conference.status === ConferenceStatus.CANCELLED
    ) {
      throw new BadRequestException(CONFERENCE_INVITE_CONFERENCE_CLOSED);
    }

    return conference;
  }

  private assertInviteTarget(dto: CreateConferenceInviteDto): void {
    const hasUserId = Boolean(dto.userId);
    const hasEmail = Boolean(dto.email);

    if (hasUserId === hasEmail) {
      throw new BadRequestException(CONFERENCE_INVITE_INVALID_TARGET);
    }
  }

  private async resolveConferenceRole(
    target: EntityLinkTarget,
    entityId: string,
    conferenceId: string,
    userId: string,
  ): Promise<ConferenceRole> {
    const authorId = await this.conferenceRepository.findEntityAuthorId(
      target,
      entityId,
    );

    if (authorId === userId) {
      return 'speaker';
    }

    const hasInvite = await this.conferenceInviteService.hasInvite(
      conferenceId,
      userId,
    );

    if (hasInvite) {
      return 'speaker';
    }

    return 'listener';
  }
}
