import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
} from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import type { UserContextService } from '../../user-context.service';
import type { ChatStateType, ChatStateUpdate } from '../chat-state';
import { type ChatReferencedItem, getRunContext } from '../chat.types';
import { messageText } from '../lib/messages';

export type ChatNode = (
  state: ChatStateType,
  config: RunnableConfig,
) => Promise<ChatStateUpdate>;

export const HISTORY_LIMIT = 10;
export const MAX_HISTORY_CHARS = 8000;

type HistoryRow = { role: string; content: string; sources: unknown };

function isReferencedItem(value: unknown): value is ChatReferencedItem {
  const source = value as { type?: unknown; id?: unknown; title?: unknown };
  return (
    typeof value === 'object' &&
    value !== null &&
    (source.type === 'idea' || source.type === 'problem') &&
    typeof source.id === 'string' &&
    typeof source.title === 'string'
  );
}

export function referencedItems(sources: unknown): ChatReferencedItem[] {
  if (!Array.isArray(sources)) return [];
  return sources
    .filter(isReferencedItem)
    .map(({ type, id, title }) => ({ type, id, title }));
}

function latestReferencedItems(rows: HistoryRow[]): ChatReferencedItem[] {
  let fallback: ChatReferencedItem[] = [];
  for (const row of rows) {
    if (row.role === 'user') continue;
    const items = referencedItems(row.sources);
    if (items.length > 1) return items;
    if (items.length === 1 && fallback.length === 0) fallback = items;
  }
  return fallback;
}

function toHistoryMessage(row: HistoryRow): BaseMessage {
  return row.role === 'user'
    ? new HumanMessage(row.content)
    : new AIMessage(row.content);
}

function trimHistory(messages: BaseMessage[]): BaseMessage[] {
  const kept: BaseMessage[] = [];
  let total = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const length = messageText(messages[i].content).length;
    if (total + length > MAX_HISTORY_CHARS) break;
    kept.unshift(messages[i]);
    total += length;
  }
  return kept;
}

export function createLoadContextNode(deps: {
  prisma: Pick<PrismaService, 'chatMessage' | 'chatSession'>;
  userContext: Pick<UserContextService, 'getContext'>;
}): ChatNode {
  return async (state, config) => {
    const context = getRunContext(config);
    const [userContext, session, rows] = await Promise.all([
      deps.userContext.getContext(context.userId),
      deps.prisma.chatSession.findUnique({
        where: { id: context.sessionId },
        select: { summary: true },
      }),
      deps.prisma.chatMessage.findMany({
        where: { sessionId: context.sessionId },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
        select: { role: true, content: true, sources: true },
      }),
    ]);

    const historyRows = rows as HistoryRow[];
    const history = trimHistory(
      [...historyRows].reverse().map(toHistoryMessage),
    );

    return {
      userContext,
      summary: session?.summary ?? null,
      referencedItems: latestReferencedItems(historyRows),
      messages: [...history, new HumanMessage(state.question)],
    };
  };
}
