import type { Prisma } from '../../generated/prisma/client';
import { LIVE_CHAT_AUTHOR_SELECT } from '../live-chat/live-chat.constants';

export const conferenceInclude = {
  scheduledBy: {
    select: LIVE_CHAT_AUTHOR_SELECT,
  },
} satisfies Prisma.ConferenceInclude;

export type ConferenceRecord = Prisma.ConferenceGetPayload<{
  include: typeof conferenceInclude;
}>;
