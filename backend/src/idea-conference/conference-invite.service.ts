import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

import { ConferenceInviteStatus } from '../../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { isUniqueConstraintError } from '../shared/utils/is-unique-error.util';
import { validateEmail } from '../shared/utils/validate-password.util';
import {
  CONFERENCE_INVITE_ALREADY_EXISTS,
  CONFERENCE_INVITE_EMAIL_MISMATCH,
  CONFERENCE_INVITE_EMAIL_SEND_FAILED,
  CONFERENCE_INVITE_EXPIRE_DAYS,
  CONFERENCE_INVITE_INVALID,
  CONFERENCE_INVITE_NOT_FOUND,
  CONFERENCE_INVITE_USER_NOT_FOUND,
} from './conference-invite.constants';
import {
  toConferenceInvitePreviewResponse,
  toConferenceInviteResponse,
} from './conference-invite.mapper';
import {
  ConferenceInviteRecord,
  ConferenceInviteRepository,
} from './conference-invite.repository';
import {
  hashInviteSecret,
  inviteSecretsMatch,
  parseInviteToken,
} from './lib/conference-invite-token.util';
import type {
  ConferenceInviteDto,
  ConferenceInvitePreviewDto,
} from './types/conference-invite.types';

@Injectable()
export class ConferenceInviteService {
  constructor(
    private readonly conferenceInviteRepository: ConferenceInviteRepository,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async invitePlatformUser(
    conferenceId: string,
    invitedById: string,
    userId: string,
  ): Promise<ConferenceInviteDto> {
    try {
      const invite = await this.conferenceInviteRepository.createPlatformInvite(
        {
          conferenceId,
          invitedById,
          userId,
        },
      );

      return toConferenceInviteResponse(invite);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(CONFERENCE_INVITE_ALREADY_EXISTS);
      }

      throw error;
    }
  }

  async inviteByEmail(
    conferenceId: string,
    invitedById: string,
    email: string,
  ): Promise<ConferenceInviteDto> {
    const normalizedEmail = validateEmail(email);
    const secret = randomBytes(32).toString('hex');
    const tokenHash = hashInviteSecret(secret);
    const expiresAt = new Date(
      Date.now() + CONFERENCE_INVITE_EXPIRE_DAYS * 24 * 60 * 60 * 1000,
    );

    let invite: ConferenceInviteRecord;

    try {
      invite = await this.conferenceInviteRepository.createExternalInvite({
        conferenceId,
        invitedById,
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(CONFERENCE_INVITE_ALREADY_EXISTS);
      }

      throw error;
    }

    const frontendUrl = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');
    const token = `${invite.id}.${secret}`;
    const inviteUrl = `${frontendUrl}/conference-invite?token=${encodeURIComponent(token)}`;

    try {
      await this.mail.sendConferenceInviteEmail({
        to: normalizedEmail,
        inviteUrl,
        expiresDays: CONFERENCE_INVITE_EXPIRE_DAYS,
      });
    } catch {
      await this.conferenceInviteRepository
        .deleteInvite(invite.id)
        .catch(() => undefined);

      throw new ServiceUnavailableException(
        CONFERENCE_INVITE_EMAIL_SEND_FAILED,
      );
    }

    return toConferenceInviteResponse(invite);
  }

  async acceptInvite(
    token: string,
    userId: string,
  ): Promise<ConferenceInviteDto> {
    const invite = await this.findValidPendingExternalInvite(token);
    const userEmail =
      await this.conferenceInviteRepository.findUserEmail(userId);

    if (!userEmail) {
      throw new NotFoundException(CONFERENCE_INVITE_NOT_FOUND);
    }

    if (userEmail.toLowerCase() !== invite.email?.toLowerCase()) {
      throw new ForbiddenException(CONFERENCE_INVITE_EMAIL_MISMATCH);
    }

    const acceptedInvite = await this.conferenceInviteRepository.acceptInvite(
      invite.id,
      userId,
    );

    return toConferenceInviteResponse(acceptedInvite);
  }

  async previewInvite(token: string): Promise<ConferenceInvitePreviewDto> {
    const invite = await this.findValidPendingExternalInvite(token);

    return toConferenceInvitePreviewResponse({
      conferenceTitle: invite.conference.title,
      ideaTitle: invite.conference.idea.title,
      scheduledFor: invite.conference.scheduledFor,
    });
  }

  async assertUserExists(userId: string): Promise<void> {
    const user = await this.conferenceInviteRepository.findUserById(userId);

    if (!user) {
      throw new BadRequestException(CONFERENCE_INVITE_USER_NOT_FOUND);
    }
  }

  async hasAcceptedInvite(
    conferenceId: string,
    userId: string,
  ): Promise<boolean> {
    const invite =
      await this.conferenceInviteRepository.findAcceptedInviteForUser(
        conferenceId,
        userId,
      );

    return invite !== null;
  }

  async hasInvite(conferenceId: string, userId: string): Promise<boolean> {
    const invite = await this.conferenceInviteRepository.findAnyInviteForUser(
      conferenceId,
      userId,
    );

    return invite !== null;
  }

  private async findValidPendingExternalInvite(token: string) {
    const parsed = parseInviteToken(token);

    if (!parsed) {
      throw new BadRequestException(CONFERENCE_INVITE_INVALID);
    }

    const invite = await this.conferenceInviteRepository.findPreviewById(
      parsed.inviteId,
    );

    if (
      !invite ||
      invite.status !== ConferenceInviteStatus.PENDING ||
      !invite.tokenHash ||
      !inviteSecretsMatch(invite.tokenHash, parsed.secret)
    ) {
      throw new BadRequestException(CONFERENCE_INVITE_INVALID);
    }

    if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(CONFERENCE_INVITE_INVALID);
    }

    return invite;
  }
}
