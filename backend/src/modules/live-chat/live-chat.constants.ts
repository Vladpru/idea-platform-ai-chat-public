import { Prisma } from '../../../generated/prisma/client';

/** Socket.IO room name for a live-chat room within the `live-chat` namespace. */
export const liveChatRoomName = (roomId: string): string =>
  `live-chat:${roomId}`;

export const LIVE_CHAT_ROOM_NOT_FOUND = 'Live chat room not found';
export const LIVE_CHAT_MESSAGE_CONTENT_MAX_LENGTH = 2000;
export const LIVE_CHAT_MESSAGE_LIST_MAX = 50;
export const LIVE_CHAT_MESSAGE_RATE_LIMIT = 10;
export const LIVE_CHAT_MESSAGE_RATE_WINDOW_MS = 10_000;
export const LIVE_CHAT_RATE_LIMIT_KEY_PREFIX = 'live-chat:rate:';
export const LIVE_CHAT_INVALID_ENTITY =
  'A live chat room must be linked to an idea, problem, or user pair';
export const LIVE_CHAT_CANNOT_CHAT_WITH_SELF =
  'You cannot start a direct chat with yourself';
export const LIVE_CHAT_USER_NOT_FOUND = 'User not found';

export const LIVE_CHAT_AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export const liveChatRoomInclude = {
  idea: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  problem: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  createdBy: {
    select: LIVE_CHAT_AUTHOR_SELECT,
  },
  participants: {
    select: {
      user: {
        select: LIVE_CHAT_AUTHOR_SELECT,
      },
    },
    orderBy: { joinedAt: 'asc' },
  },
} satisfies Prisma.LiveChatRoomInclude;

export const liveChatMessageInclude = {
  author: {
    select: LIVE_CHAT_AUTHOR_SELECT,
  },
} satisfies Prisma.LiveChatMessageInclude;
