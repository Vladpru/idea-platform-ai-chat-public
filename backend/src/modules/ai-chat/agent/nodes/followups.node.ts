import type { Runnable } from '@langchain/core/runnables';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

import { messageText } from '../lib/messages';
import { buildFollowupsPrompt } from '../prompts/intent.prompts';
import type { ChatNode } from './load-context.node';

export const followupsSchema = z.object({
  suggestions: z.array(z.string().min(1).max(120)).max(3),
});

const logger = new Logger('FollowupsNode');

export function createFollowupsNode(
  generator: Runnable<string, unknown>,
): ChatNode {
  return async (state, config) => {
    const answer = messageText(state.messages.at(-1)?.content);
    if (!answer.trim()) return { suggestions: [] };
    try {
      const raw = await generator.invoke(
        buildFollowupsPrompt(state.question, answer),
        config,
      );
      return { suggestions: followupsSchema.parse(raw).suggestions };
    } catch (error) {
      logger.warn(
        `Follow-up suggestions failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { suggestions: [] };
    }
  };
}

export function createNoFollowupsNode(): ChatNode {
  return () => Promise.resolve({ suggestions: [] });
}
