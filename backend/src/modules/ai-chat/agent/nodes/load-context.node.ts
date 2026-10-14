import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
} from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import type { UserContextService } from '../../user-context.service';
import type { ChatStateType, ChatStateUpdate } from '../chat-state';
import { getRunContext } from '../chat.types';
import { messageText } from '../lib/messages';

export type ChatNode = (
  state: ChatStateType,
  config: RunnableConfig,
) => Promise<ChatStateUpdate>;

export const HISTORY_LIMIT = 10;
export const MAX_HISTORY_CHARS = 8000;

type HistoryRow = { role: string; content: string; sources: unknown };

function isEntitySource(
  value: unknown,
): value is { type: 'idea' | 'problem'; id: string; title: string } {
  const source = value as { type?: unknown; id?: unknown; title?: unknown };
  return (
    typeof value === 'object' &&
    value !== null &&
    (source.type === 'idea' || source.type === 'problem') &&
    typeof source.id === 'string' &&
    typeof source.title === 'string'
  );
}

export function referencedLine(sources: unknown): string | null {
  if (!Array.isArray(sources)) return null;
  const refs = sources
    .filter(isEntitySource)
    .map(source => `${source.type}:${source.id} "${source.title}"`);
  return refs.length ? `Referenced: ${refs.join(', ')}` : null;
}

function toHistoryMessage(row: HistoryRow): BaseMessage {
  if (row.role === 'user') return new HumanMessage(row.content);
  const refs = referencedLine(row.sources);
  return new AIMessage(refs ? `${row.content}\n\n${refs}` : row.content);
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

    const history = trimHistory(
      [...(rows as HistoryRow[])].reverse().map(toHistoryMessage),
    );

    return {
      userContext,
      summary: session?.summary ?? null,
      messages: [...history, new HumanMessage(state.question)],
    };
  };
}
