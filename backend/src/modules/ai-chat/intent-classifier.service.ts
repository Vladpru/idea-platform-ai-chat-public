import { Injectable, Logger } from '@nestjs/common';

import { GeminiService } from '../ai/gemini.service';

export type ChatIntent =
  | 'search'
  | 'explain'
  | 'compare'
  | 'summarize'
  | 'navigate'
  | 'create_idea'
  | 'create_problem'
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
  - create_idea: user wants to create a new idea or draft an idea
  - create_problem: user wants to create a new problem or draft a problem
  - general: anything else

  Reply with a single JSON object, no markdown, no extra text:
  {"intent":"<one of the intents above>","entityHint":"<value or null>"}

  For intents other than create_idea and create_problem, entityHint is a short keyword string or null.

  For create_idea, entityHint MUST be a JSON string (not an object — a stringified object):
  {"title":"<concise title>","description":"<1-2 sentence description>","tags":["<tag1>","<tag2>"]}

  For create_problem, entityHint MUST be a JSON string:
  {"title":"<concise title>","description":"<1-2 sentence description>"}

  Examples:
  Message: "list ideas about proptech" → {"intent":"search","entityHint":"proptech"}
  Message: "explain the SmartCity Hub idea" → {"intent":"explain","entityHint":"SmartCity Hub"}
  Message: "compare the two mobility ideas" → {"intent":"compare","entityHint":"mobility"}
  Message: "what happened this week?" → {"intent":"summarize","entityHint":null}
  Message: "how do I submit a problem?" → {"intent":"navigate","entityHint":null}
  Message: "thanks!" → {"intent":"general","entityHint":null}
  Message: "create an idea about smart parking" → {"intent":"create_idea","entityHint":"{\"title\":\"Smart Parking\",\"description\":\"A system to manage parking spaces using IoT sensors.\",\"tags\":[\"mobility\",\"IoT\"]}"}
  Message: "I want to submit a problem about slow onboarding" → {"intent":"create_problem","entityHint":"{\"title\":\"Slow Onboarding\",\"description\":\"New users face a steep learning curve when joining the platform.\"}"}

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
