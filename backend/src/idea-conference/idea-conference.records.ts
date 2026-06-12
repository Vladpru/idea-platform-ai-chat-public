import type { Prisma } from '../../generated/prisma/client';
import { LIVE_CHAT_AUTHOR_SELECT } from '../live-chat/live-chat.constants';

export const ideaConferenceInclude = {
  scheduledBy: {
    select: LIVE_CHAT_AUTHOR_SELECT,
  },
} satisfies Prisma.IdeaConferenceInclude;

export type IdeaConferenceRecord = Prisma.IdeaConferenceGetPayload<{
  include: typeof ideaConferenceInclude;
}>;
