import type {
  ConferenceInviteStatus,
  ConferenceInviteType,
} from '../../../generated/prisma/client';

export type ConferenceInviteDto = {
  id: string;
  conferenceId: string;
  inviteType: ConferenceInviteType;
  status: ConferenceInviteStatus;
  userId: string | null;
  email: string | null;
  createdAt: string;
};

export type ConferenceInvitePreviewDto = {
  conferenceTitle: string;
  ideaTitle: string | null;
  scheduledFor: string;
};
