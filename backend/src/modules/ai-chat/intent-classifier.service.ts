import { Injectable, Logger } from '@nestjs/common';

import { GeminiService } from '../ai/gemini.service';

export type ChatIntent =
  | 'search'
  | 'explain'
  | 'compare'
  | 'summarize'
  | 'navigate'
  | 'general';

export interface ClassifiedIntent {
  intent: ChatIntent;
  entityHint: string | null;
}

const INTENT_PROMPT = `Classify the user message into exactly one intent and extract an optional entity hint.

Intents:
- search: user wants to find, list, or browse ideas/problems by keyword, topic, tag, or category
- explain: user wants a deep explanation of a specific idea, problem, or concept
- compare: user wants to compare two or more ideas or problems
- summarize: user wants a summary of recent activity, trends, or a group of entities
- navigate: user wants help finding a platform feature or understanding how to use the platform
- general: anything else

Reply with a single JSON object, no markdown, no extra text:
{"intent":"<one of the intents above>","entityHint":"<short keyword extracted from the message, or null>"}

Examples:
Message: "list ideas about proptech" → {"intent":"search","entityHint":"proptech"}
Message: "explain the SmartCity Hub idea" → {"intent":"explain","entityHint":"SmartCity Hub"}
Message: "compare the two mobility ideas" → {"intent":"compare","entityHint":"mobility"}
Message: "what happened this week?" → {"intent":"summarize","entityHint":null}
Message: "how do I submit a problem?" → {"intent":"navigate","entityHint":null}
Message: "thanks!" → {"intent":"general","entityHint":null}

Message: `;

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);

  constructor(private readonly gemini: GeminiService) {}

  async classify(message: string): Promise<ClassifiedIntent> {
    try {
      const raw = await this.gemini.generateChatAnswer(
        INTENT_PROMPT + JSON.stringify(message),
      );
      const cleaned = raw.trim().replace(/^```json|```$/g, '').trim();
      const parsed = JSON.parse(cleaned) as {
        intent: ChatIntent;
        entityHint: string | null;
      };
      if (!parsed.intent) throw new Error('missing intent field');
      return { intent: parsed.intent, entityHint: parsed.entityHint ?? null };
    } catch (error) {
      this.logger.warn(
        'Intent classification failed, defaulting to general',
        error instanceof Error ? error.message : String(error),
      );
      return { intent: 'general', entityHint: null };
    }
  }
}
