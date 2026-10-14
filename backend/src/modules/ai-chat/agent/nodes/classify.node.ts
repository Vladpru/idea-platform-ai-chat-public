import type { Runnable } from '@langchain/core/runnables';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

import { CHAT_INTENTS, getRunContext } from '../chat.types';
import { CLASSIFY_PROMPT } from '../prompts/intent.prompts';
import type { ChatNode } from './load-context.node';

export const classificationSchema = z.object({
  intent: z.enum(CHAT_INTENTS),
  entityHint: z.string().max(100).nullable(),
});

type Classification = z.infer<typeof classificationSchema>;

const FALLBACK: Classification = { intent: 'general', entityHint: null };
const logger = new Logger('ClassifyNode');

export function createClassifyNode(
  classifier: Runnable<string, unknown>,
): ChatNode {
  return async (state, config) => {
    const context = getRunContext(config);
    let result = FALLBACK;
    try {
      const raw = await classifier.invoke(
        `${CLASSIFY_PROMPT}\n\nMessage: ${JSON.stringify(state.question)}`,
        config,
      );
      result = classificationSchema.parse(raw);
    } catch (error) {
      logger.warn(
        `Intent classification failed, using general: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    context.emit({
      type: 'intent',
      intent: result.intent,
      entityHint: result.entityHint,
    });
    return { intent: result.intent, entityHint: result.entityHint };
  };
}
