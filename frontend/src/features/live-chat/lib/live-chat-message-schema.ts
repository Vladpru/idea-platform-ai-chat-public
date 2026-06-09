import { z } from 'zod';

export const LIVE_CHAT_MESSAGE_MAX_LENGTH = 2000;

export const liveChatMessageContentSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIVE_CHAT_MESSAGE_MAX_LENGTH);
