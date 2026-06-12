import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { IdeaConferenceStatus } from '../../generated/prisma/client';
import { EntityTarget } from '../entity-visibility/entity-target.enum';
import { EntityVisibilityService } from '../entity-visibility/entity-visibility.service';
import { formatAuthorDisplayName } from '../live-chat/live-chat.mapper';
import { LivekitRoomService } from '../livekit/livekit-room.service';
import { LivekitTokenService } from '../livekit/livekit-token.service';
import { LIVEKIT_ROOM_EMPTY_TIMEOUT_SECONDS } from '../livekit/livekit.constants';
import { isUniqueConstraintError } from '../shared/utils/is-unique-error.util';
import {
  CONFERENCE_INVITE_CANNOT_INVITE_AUTHOR,
  CONFERENCE_INVITE_CONFERENCE_CLOSED,
  CONFERENCE_INVITE_INVALID_TARGET,
} from './conference-invite.constants';
import { ConferenceInviteService } from './conference-invite.service';
import type { CreateConferenceInviteDto } from './dto/create-conference-invite.dto';
import type { CreateIdeaConferenceDto } from './dto/create-idea-conference.dto';
import type { IdeaConferenceUpdateAction } from './dto/update-idea-conference.dto';
import {
  IDEA_CONFERENCE_ALREADY_LIVE,
  IDEA_CONFERENCE_AUTHOR_ONLY,
  IDEA_CONFERENCE_INVALID_SPEAKERS,
  IDEA_CONFERENCE_NOT_FOUND,
  IDEA_CONFERENCE_NOT_LIVE,
  IDEA_CONFERENCE_NOT_SCHEDULED,
  IDEA_CONFERENCE_SCHEDULED_FOR_PAST,
} from './idea-conference.constants';
import {
  buildConferenceProviderRoomName,
  mapInviteStateByUserId,
  toIdeaConferenceResponse,
  toInviteState,
  toSuggestedSpeakerResponse,
} from './idea-conference.mapper';
import { IdeaConferenceRepository } from './idea-conference.repository';
import type { ConferenceInviteDto } from './types/conference-invite.types';
import type {
  ConferenceRole,
  IdeaConferenceDto,
  IdeaConferenceListResponse,
  JoinConferenceResponse,
  SuggestedSpeakersResponse,
} from './types/idea-conference.types';

@Injectable()
export class IdeaConferenceService {
  constructor(
    private readonly ideaConferenceRepository: IdeaConferenceRepository,
    private readonly entityVisibility: EntityVisibilityService,
    private readonly livekitRoomService: LivekitRoomService,
    private readonly livekitTokenService: LivekitTokenService,
    private readonly conferenceInviteService: ConferenceInviteService,
  ) {}

  async schedule(
    ideaId: string,
    userId: string,
    dto: CreateIdeaConferenceDto,
  ): Promise<IdeaConferenceDto> {
    await this.assertIdeaAuthor(ideaId, userId);

    const scheduledDate = new Date(dto.scheduledFor);

    if (Number.isNaN(scheduledDate.getTime())) {
      throw new BadRequestException(IDEA_CONFERENCE_SCHEDULED_FOR_PAST);
    }

    if (scheduledDate.getTime() <= Date.now()) {
      throw new BadRequestException(IDEA_CONFERENCE_SCHEDULED_FOR_PAST);
    }

    const speakerUserIds = await this.resolveSpeakerUserIds(
      ideaId,
      dto.speakerUserIds ?? [],
    );

    const conference =
      await this.ideaConferenceRepository.createConferenceWithInvites({
        conference: {
          ideaId,
          scheduledById: userId,
          title: dto.title,
          description: dto.description ?? null,
          scheduledFor: scheduledDate,
        },
        speakerUserIds,
        invitedById: userId,
      });

    return toIdeaConferenceResponse(conference);
  }

  async listByIdea(
    ideaId: string,
    userId: string,
  ): Promise<IdeaConferenceListResponse> {
    await this.entityVisibility.getVisibleEntity(
      EntityTarget.IDEA,
      ideaId,
      userId,
    );

    const conferences =
      await this.ideaConferenceRepository.findManyByIdeaId(ideaId);

    return {
      conferences: conferences.map(toIdeaConferenceResponse),
    };
  }

  async getSuggestedSpeakers(
    ideaId: string,
    userId: string,
    conferenceId?: string,
  ): Promise<SuggestedSpeakersResponse> {
    await this.entityVisibility.getVisibleEntity(
      EntityTarget.IDEA,
      ideaId,
      userId,
    );

    const team = await this.ideaConferenceRepository.findIdeaTeam(ideaId);

    if (!team) {
      throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
    }

    const resolvedConferenceId = await this.resolveConferenceIdForSpeakers(
      ideaId,
      conferenceId,
    );

    const inviteStateByUserId = resolvedConferenceId
      ? mapInviteStateByUserId(
          await this.ideaConferenceRepository.findInvitesByConferenceId(
            resolvedConferenceId,
          ),
        )
      : new Map();

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
    ideaId: string,
    conferenceId: string,
    userId: string,
    dto: CreateConferenceInviteDto,
  ): Promise<ConferenceInviteDto> {
    await this.assertIdeaAuthor(ideaId, userId);

    const conference = await this.findConferenceForMutation(
      ideaId,
      conferenceId,
    );

    this.assertInviteTarget(dto);

    if (dto.userId) {
      const authorId =
        await this.ideaConferenceRepository.findIdeaAuthorId(ideaId);

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
    ideaId: string,
    conferenceId: string,
    userId: string,
  ): Promise<JoinConferenceResponse> {
    await this.entityVisibility.getVisibleEntity(
      EntityTarget.IDEA,
      ideaId,
      userId,
    );

    const conference = await this.ideaConferenceRepository.findById(
      conferenceId,
      ideaId,
    );

    if (!conference) {
      throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
    }

    if (conference.status !== IdeaConferenceStatus.LIVE) {
      throw new BadRequestException(IDEA_CONFERENCE_NOT_LIVE);
    }

    if (!conference.providerRoomName) {
      throw new BadRequestException(IDEA_CONFERENCE_NOT_LIVE);
    }

    const participant =
      await this.ideaConferenceRepository.findUserAuthor(userId);

    if (!participant) {
      throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
    }

    const role = await this.resolveConferenceRole(
      ideaId,
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
      conference: toIdeaConferenceResponse(conference),
    };
  }

  async handleRoomFinished(providerRoomName: string): Promise<void> {
    const conference =
      await this.ideaConferenceRepository.findByProviderRoomName(
        providerRoomName,
      );

    if (!conference || conference.status !== IdeaConferenceStatus.LIVE) {
      return;
    }

    await this.ideaConferenceRepository.updateStatus(conference.id, {
      status: IdeaConferenceStatus.ENDED,
      endedAt: new Date(),
    });
  }

  async updateStatus(
    ideaId: string,
    conferenceId: string,
    userId: string,
    action: IdeaConferenceUpdateAction,
  ): Promise<IdeaConferenceDto> {
    if (action === 'end') {
      await this.assertAuthorOrSpeaker(ideaId, conferenceId, userId);
    } else {
      await this.assertIdeaAuthor(ideaId, userId);
    }

    const conference = await this.ideaConferenceRepository.findById(
      conferenceId,
      ideaId,
    );

    if (!conference) {
      throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
    }

    switch (action) {
      case 'start':
        return this.startConference(ideaId, conference);
      case 'end':
        return this.endConference(conference);
      case 'cancel':
        return this.cancelConference(conference);
      default:
        throw new BadRequestException('Invalid conference action');
    }
  }

  private async startConference(
    ideaId: string,
    conference: NonNullable<
      Awaited<ReturnType<IdeaConferenceRepository['findById']>>
    >,
  ): Promise<IdeaConferenceDto> {
    if (conference.status !== IdeaConferenceStatus.SCHEDULED) {
      throw new BadRequestException(IDEA_CONFERENCE_NOT_SCHEDULED);
    }

    const existingLive =
      await this.ideaConferenceRepository.findLiveConference(ideaId);

    if (existingLive && existingLive.id !== conference.id) {
      throw new ConflictException(IDEA_CONFERENCE_ALREADY_LIVE);
    }

    const startedAt = new Date();
    const providerRoomName = buildConferenceProviderRoomName(conference.id);

    let updatedConference;

    try {
      updatedConference = await this.ideaConferenceRepository.updateStatus(
        conference.id,
        {
          status: IdeaConferenceStatus.LIVE,
          startedAt,
          providerRoomName,
        },
      );
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      throw new ConflictException(IDEA_CONFERENCE_ALREADY_LIVE);
    }

    try {
      await this.livekitRoomService.createRoom(
        providerRoomName,
        LIVEKIT_ROOM_EMPTY_TIMEOUT_SECONDS,
      );
    } catch (error) {
      await this.ideaConferenceRepository
        .updateStatus(conference.id, {
          status: IdeaConferenceStatus.SCHEDULED,
          startedAt: null,
          providerRoomName: null,
        })
        .catch(() => undefined);

      throw error;
    }

    return toIdeaConferenceResponse(updatedConference);
  }

  private async endConference(
    conference: NonNullable<
      Awaited<ReturnType<IdeaConferenceRepository['findById']>>
    >,
  ): Promise<IdeaConferenceDto> {
    if (conference.status !== IdeaConferenceStatus.LIVE) {
      throw new BadRequestException(IDEA_CONFERENCE_NOT_LIVE);
    }

    if (conference.providerRoomName) {
      await this.livekitRoomService
        .deleteRoom(conference.providerRoomName)
        .catch(() => undefined);
    }

    const updatedConference = await this.ideaConferenceRepository.updateStatus(
      conference.id,
      {
        status: IdeaConferenceStatus.ENDED,
        endedAt: new Date(),
      },
    );

    return toIdeaConferenceResponse(updatedConference);
  }

  private async cancelConference(
    conference: NonNullable<
      Awaited<ReturnType<IdeaConferenceRepository['findById']>>
    >,
  ): Promise<IdeaConferenceDto> {
    if (conference.status !== IdeaConferenceStatus.SCHEDULED) {
      throw new BadRequestException(IDEA_CONFERENCE_NOT_SCHEDULED);
    }

    const updatedConference = await this.ideaConferenceRepository.updateStatus(
      conference.id,
      {
        status: IdeaConferenceStatus.CANCELLED,
        endedAt: new Date(),
      },
    );

    return toIdeaConferenceResponse(updatedConference);
  }

  private async assertIdeaAuthor(
    ideaId: string,
    userId: string,
  ): Promise<void> {
    const authorId =
      await this.ideaConferenceRepository.findIdeaAuthorId(ideaId);

    if (!authorId) {
      throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
    }

    if (authorId !== userId) {
      throw new ForbiddenException(IDEA_CONFERENCE_AUTHOR_ONLY);
    }
  }

  private async assertAuthorOrSpeaker(
    ideaId: string,
    conferenceId: string,
    userId: string,
  ): Promise<void> {
    const authorId =
      await this.ideaConferenceRepository.findIdeaAuthorId(ideaId);

    if (!authorId) {
      throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
    }

    if (authorId === userId) {
      return;
    }

    const hasInvite = await this.conferenceInviteService.hasInvite(
      conferenceId,
      userId,
    );

    if (!hasInvite) {
      throw new ForbiddenException(IDEA_CONFERENCE_AUTHOR_ONLY);
    }
  }

  private async resolveSpeakerUserIds(
    ideaId: string,
    speakerUserIds: string[],
  ): Promise<string[]> {
    if (speakerUserIds.length === 0) {
      return [];
    }

    const team = await this.ideaConferenceRepository.findIdeaTeam(ideaId);

    if (!team) {
      throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
    }

    const teamUserIds = new Set([
      team.authorId,
      ...team.members.map(member => member.id),
    ]);

    const uniqueSpeakerIds = [...new Set(speakerUserIds)].filter(
      id => id !== team.authorId,
    );

    if (uniqueSpeakerIds.some(id => !teamUserIds.has(id))) {
      throw new BadRequestException(IDEA_CONFERENCE_INVALID_SPEAKERS);
    }

    return uniqueSpeakerIds;
  }

  private async resolveConferenceIdForSpeakers(
    ideaId: string,
    conferenceId?: string,
  ): Promise<string | null> {
    if (conferenceId) {
      const conference = await this.ideaConferenceRepository.findById(
        conferenceId,
        ideaId,
      );

      if (!conference) {
        throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
      }

      return conference.id;
    }

    const liveConference =
      await this.ideaConferenceRepository.findLiveConference(ideaId);

    if (liveConference) {
      return liveConference.id;
    }

    const nextScheduled =
      await this.ideaConferenceRepository.findNextScheduledConference(ideaId);

    return nextScheduled?.id ?? null;
  }

  private async findConferenceForMutation(
    ideaId: string,
    conferenceId: string,
  ) {
    const conference = await this.ideaConferenceRepository.findById(
      conferenceId,
      ideaId,
    );

    if (!conference) {
      throw new NotFoundException(IDEA_CONFERENCE_NOT_FOUND);
    }

    if (
      conference.status === IdeaConferenceStatus.ENDED ||
      conference.status === IdeaConferenceStatus.CANCELLED
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
    ideaId: string,
    conferenceId: string,
    userId: string,
  ): Promise<ConferenceRole> {
    const authorId =
      await this.ideaConferenceRepository.findIdeaAuthorId(ideaId);

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
