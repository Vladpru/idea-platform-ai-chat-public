import type { ChatIntent } from '../chat.types';

export const INTENT_INSTRUCTIONS: Record<ChatIntent, string> = {
  search:
    'The user wants to find or list ideas or problems. Call search_ideas_problems with a focused query. List each result with its title, type, stage, status and a one-sentence description. If nothing matches, say so.',
  explain:
    'The user wants a detailed explanation of an idea, problem or concept. If the item was referenced earlier in the conversation, call get_entity with its ID; otherwise find it with search_ideas_problems first. Use search_knowledge for platform concepts. Structure the answer with short headings or bullet points.',
  compare:
    'The user wants to compare two or more items. Get each item with get_entity, finding IDs with search_ideas_problems when needed. Present the comparison as a Markdown table or parallel bullet points covering stage, status, tags and the core difference.',
  summarize:
    "The user wants a summary. For the user's own work, call get_my_items. For a topic, call search_ideas_problems and search_knowledge. Summarise the key themes, stages and notable items in a few bullet points.",
  navigate:
    'The user wants help using the platform. Call search_knowledge for the relevant feature and explain the steps clearly. If nothing is found, describe how the platform generally works without inventing specific buttons or pages.',
  create_idea:
    'The user wants to create a new idea. Call propose_draft exactly once with draftType "idea", a concise title, a 1-3 sentence description and up to 5 tags derived from the message. Then reply with 2-3 sentences summarising the draft and tell the user they can create it from the card shown below. Do not ask for more information first.',
  create_problem:
    'The user wants to submit a new problem. Call propose_draft exactly once with draftType "problem", a concise title and a 1-3 sentence description. Then reply with 2-3 sentences summarising the problem and remind the user it is saved as a draft they can edit before publishing.',
  general:
    "Answer the user helpfully. Use search_knowledge when the question is about the platform and get_my_items when it is about the user's own ideas or problems. For greetings or thanks, reply briefly without tools.",
};

export const CLASSIFY_PROMPT = `Classify the user's message for the Idea Platform assistant into exactly one intent and extract an optional short entity hint.

Intents:
- search: find, list or browse ideas or problems by keyword, topic, tag or category
- explain: deep explanation of a specific idea, problem or concept
- compare: compare two or more ideas or problems
- summarize: summary of recent activity, trends, the user's own work, or a group of items
- navigate: how to use a platform feature
- create_idea: create or draft a new idea
- create_problem: create or draft a new problem
- general: anything else, including greetings and thanks

entityHint: a short keyword or name from the message (max 5 words), or null.`;

export function buildFollowupsPrompt(question: string, answer: string): string {
  return [
    'Suggest up to 3 short follow-up questions the user might ask next on the Idea Platform.',
    "Write them from the user's point of view, each under 80 characters. Return an empty list if none fit.",
    '',
    `User question: ${question}`,
    '',
    `Assistant answer: ${answer.slice(0, 2000)}`,
  ].join('\n');
}

export function buildSummaryPrompt(
  previous: string | null,
  rows: { role: string; content: string }[],
): string {
  const transcript = rows
    .map(row => `${row.role === 'user' ? 'User' : 'Assistant'}: ${row.content}`)
    .join('\n');
  return [
    'Update the running summary of a conversation between a user and the Idea Platform assistant.',
    'Keep facts the user may refer to later: names and IDs of ideas and problems, decisions, preferences and open questions.',
    'Write plain prose, at most 1200 characters. Output only the summary.',
    '',
    `Previous summary: ${previous ?? '(none)'}`,
    '',
    'New messages:',
    transcript,
  ].join('\n');
}
