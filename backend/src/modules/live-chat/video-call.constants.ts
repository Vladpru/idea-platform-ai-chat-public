import { Prisma } from '../../../generated/prisma/client';
import { LIVE_CHAT_AUTHOR_SELECT } from './live-chat.constants';

export const VIDEO_CALL_NOT_FOUND = 'Video call not found';
export const VIDEO_CALL_ALREADY_ACTIVE =
  'This live chat room already has an active video call';
export const VIDEO_CALL_NOT_ACTIVE = 'Video call is not active';
export const VIDEO_CALL_NOT_SCHEDULED = 'Video call is not scheduled';
export const VIDEO_CALL_HOST_ONLY =
  'Only the call host can perform this action';
export const VIDEO_CALL_SCHEDULED_FOR_PAST =
  'Scheduled time must be in the future';
export {
  LIVEKIT_ROOM_EMPTY_TIMEOUT_SECONDS as VIDEO_CALL_EMPTY_TIMEOUT_SECONDS,
  LIVEKIT_TOKEN_TTL_SECONDS as VIDEO_CALL_TOKEN_TTL_SECONDS,
} from '../../core/livekit/livekit.constants';

export const videoCallInclude = {
  host: {
    select: LIVE_CHAT_AUTHOR_SELECT,
  },
} satisfies Prisma.VideoCallInclude;
