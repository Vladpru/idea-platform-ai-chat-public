import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import { getRunContext } from '../chat.types';
import { normalizeTags, toolOk } from './tool-utils';

const MAX_DRAFT_TAGS = 5;

export function createProposeDraftTool() {
  return tool(
    ({ draftType, title, description, tags }, config) => {
      const context = getRunContext(config);
      context.emit({
        type: 'draft_proposal',
        draftType,
        title: title.trim(),
        description: description.trim(),
        tags: draftType === 'idea' ? normalizeTags(tags, MAX_DRAFT_TAGS) : [],
      });
      return toolOk({
        ok: true,
        note: 'A draft card is now shown to the user. They can create the draft from it.',
      });
    },
    {
      name: 'propose_draft',
      description:
        'Show the user a pre-filled card to create a new idea or problem draft. Does not save anything.',
      schema: z.object({
        draftType: z.enum(['idea', 'problem']),
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(5000),
        tags: z.array(z.string()).max(10).default([]),
      }),
    },
  );
}
