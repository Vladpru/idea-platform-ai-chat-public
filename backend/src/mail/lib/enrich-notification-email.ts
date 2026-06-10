import { MediaKind } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type {
  EnrichedCommentContext,
  EnrichedDirectMessageContext,
  EnrichedEmailContext,
  EnrichedEntityCard,
} from '../types/enriched-email.types';
import type { NotificationEmailJobData } from '../types/notification-email.types';

function readString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

function trimExcerpt(
  text: string | null | undefined,
  max = 160,
): string | null {
  if (!text) {
    return null;
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) {
    return null;
  }

  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max).trimEnd()}…`;
}

function formatAuthorName(
  firstName: string | null,
  lastName: string | null,
): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name.length > 0 ? name : 'Unknown';
}

function formatCommentTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const AUTHOR_DISPLAY_SELECT = {
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

type AuthorDisplay = {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

async function fetchAuthorDisplay(
  prisma: PrismaService,
  authorId: string,
): Promise<AuthorDisplay | null> {
  return prisma.user.findUnique({
    where: { id: authorId },
    select: AUTHOR_DISPLAY_SELECT,
  });
}

function buildFrontendPaths(frontendUrl: string) {
  const base = frontendUrl.replace(/\/$/, '');

  return {
    ideaDetail: (id: string) => `${base}/ideas/${id}`,
    ideaDiscussionReply: (id: string, commentId: string) =>
      `${base}/ideas/${id}?tab=discussion&replyTo=${encodeURIComponent(commentId)}`,
    ideaEdit: (id: string) =>
      `${base}/ideas/new?ideaId=${encodeURIComponent(id)}`,
    problemDetail: (id: string) => `${base}/problems/${id}`,
    problemDiscussionReply: (id: string, commentId: string) =>
      `${base}/problems/${id}?tab=discussion&replyTo=${encodeURIComponent(commentId)}`,
    problemEdit: (id: string) =>
      `${base}/problems/new?problemId=${encodeURIComponent(id)}`,
    settings: `${base}/settings/notifications`,
    liveChatRoom: (roomId: string) => `${base}/live-chats/${roomId}`,
  };
}

async function fetchIdeaEntity(
  prisma: PrismaService,
  ideaId: string,
  paths: ReturnType<typeof buildFrontendPaths>,
): Promise<EnrichedEntityCard | null> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      stage: true,
      viewCount: true,
      commentCount: true,
      likeCount: true,
      authorId: true,
      media: {
        where: { kind: MediaKind.MAIN_IMAGE },
        orderBy: { sortOrder: 'asc' },
        take: 1,
        select: { url: true },
      },
      tags: {
        take: 4,
        select: { tag: { select: { name: true, label: true } } },
      },
    },
  });

  if (!idea) {
    return null;
  }

  const author = await fetchAuthorDisplay(prisma, idea.authorId);

  const tags = idea.tags.map(entry => entry.tag.label ?? entry.tag.name);
  const imageUrl =
    idea.media[0]?.url ??
    (
      await prisma.ideaMedia.findFirst({
        where: { ideaId },
        orderBy: { sortOrder: 'asc' },
        select: { url: true },
      })
    )?.url ??
    null;

  const isDraft = idea.status === 'DRAFT';

  return {
    entityType: 'idea',
    entityId: idea.id,
    title: idea.title ?? 'Untitled',
    descriptionExcerpt: trimExcerpt(idea.description),
    imageUrl,
    authorName: formatAuthorName(
      author?.firstName ?? null,
      author?.lastName ?? null,
    ),
    authorAvatarUrl: author?.avatarUrl ?? null,
    stageLabel: idea.stage,
    statusLabel: idea.status,
    tags: tags.slice(0, 3),
    extraTagCount: Math.max(0, tags.length - 3),
    viewCount: idea.viewCount,
    commentCount: idea.commentCount,
    likeCount: idea.likeCount,
    detailUrl: paths.ideaDetail(idea.id),
    editUrl: isDraft ? paths.ideaEdit(idea.id) : null,
  };
}

async function fetchProblemEntity(
  prisma: PrismaService,
  problemId: string,
  paths: ReturnType<typeof buildFrontendPaths>,
): Promise<EnrichedEntityCard | null> {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      stage: true,
      viewCount: true,
      commentCount: true,
      likeCount: true,
      authorId: true,
      media: {
        where: { kind: MediaKind.MAIN_IMAGE },
        orderBy: { sortOrder: 'asc' },
        take: 1,
        select: { url: true },
      },
      tags: {
        take: 4,
        select: { tag: { select: { name: true, label: true } } },
      },
    },
  });

  if (!problem) {
    return null;
  }

  const author = await fetchAuthorDisplay(prisma, problem.authorId);

  const tags = problem.tags.map(entry => entry.tag.label ?? entry.tag.name);
  const imageUrl =
    problem.media[0]?.url ??
    (
      await prisma.problemMedia.findFirst({
        where: { problemId },
        orderBy: { sortOrder: 'asc' },
        select: { url: true },
      })
    )?.url ??
    null;

  const isDraft = problem.status === 'DRAFT';

  return {
    entityType: 'problem',
    entityId: problem.id,
    title: problem.title,
    descriptionExcerpt: trimExcerpt(problem.description),
    imageUrl,
    authorName: formatAuthorName(
      author?.firstName ?? null,
      author?.lastName ?? null,
    ),
    authorAvatarUrl: author?.avatarUrl ?? null,
    stageLabel: problem.stage,
    statusLabel: problem.status,
    tags: tags.slice(0, 3),
    extraTagCount: Math.max(0, tags.length - 3),
    viewCount: problem.viewCount,
    commentCount: problem.commentCount,
    likeCount: problem.likeCount,
    detailUrl: paths.problemDetail(problem.id),
    editUrl: isDraft ? paths.problemEdit(problem.id) : null,
  };
}

async function resolveEntityFromPayload(
  prisma: PrismaService,
  payload: Record<string, unknown>,
  paths: ReturnType<typeof buildFrontendPaths>,
): Promise<EnrichedEntityCard | null> {
  const entityType = readString(payload, 'entityType');
  const entityId = readString(payload, 'entityId');
  const ideaId = readString(payload, 'ideaId');
  const problemId = readString(payload, 'problemId');
  const matchedEntityId = readString(payload, 'matchedEntityId');
  const sourceEntityId = readString(payload, 'sourceEntityId');

  if (entityType === 'idea' && entityId) {
    return fetchIdeaEntity(prisma, entityId, paths);
  }

  if (entityType === 'problem' && entityId) {
    return fetchProblemEntity(prisma, entityId, paths);
  }

  if (ideaId) {
    return fetchIdeaEntity(prisma, ideaId, paths);
  }

  if (problemId) {
    return fetchProblemEntity(prisma, problemId, paths);
  }

  if (matchedEntityId) {
    const matchedType = entityType === 'problem' ? 'problem' : 'idea';
    return matchedType === 'problem'
      ? fetchProblemEntity(prisma, matchedEntityId, paths)
      : fetchIdeaEntity(prisma, matchedEntityId, paths);
  }

  if (sourceEntityId) {
    const sourceType = entityType === 'problem' ? 'problem' : 'idea';
    return sourceType === 'problem'
      ? fetchProblemEntity(prisma, sourceEntityId, paths)
      : fetchIdeaEntity(prisma, sourceEntityId, paths);
  }

  return null;
}

async function enrichCommentContext(
  prisma: PrismaService,
  payload: Record<string, unknown>,
  paths: ReturnType<typeof buildFrontendPaths>,
): Promise<EnrichedCommentContext | null> {
  const commentId = readString(payload, 'commentId');
  const entityType = readString(payload, 'entityType');
  const entityId = readString(payload, 'entityId');
  const actorName = readString(payload, 'actorName') || 'Someone';
  const entityTitle = readString(payload, 'entityTitle') || 'Untitled';
  const contentSnippet = readString(payload, 'contentSnippet');

  let actorAvatarUrl: string | null = null;
  let timestamp = '';

  if (commentId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        createdAt: true,
        authorId: true,
      },
    });

    if (comment) {
      timestamp = formatCommentTimestamp(comment.createdAt);
      const author = await fetchAuthorDisplay(prisma, comment.authorId);
      actorAvatarUrl = author?.avatarUrl ?? null;
    }
  }

  const actorId = readString(payload, 'actorId');
  if (!actorAvatarUrl && actorId) {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { avatarUrl: true },
    });
    actorAvatarUrl = actor?.avatarUrl ?? null;
  }

  if (!entityId || (entityType !== 'idea' && entityType !== 'problem')) {
    return null;
  }

  const replyUrl =
    commentId && entityType === 'idea'
      ? paths.ideaDiscussionReply(entityId, commentId)
      : commentId && entityType === 'problem'
        ? paths.problemDiscussionReply(entityId, commentId)
        : entityType === 'idea'
          ? paths.ideaDetail(entityId)
          : paths.problemDetail(entityId);

  return {
    actorName,
    actorAvatarUrl,
    timestamp,
    entityTitle,
    entityType,
    entityId,
    contentSnippet,
    replyUrl,
  };
}

async function enrichDirectMessageContext(
  prisma: PrismaService,
  payload: Record<string, unknown>,
  paths: ReturnType<typeof buildFrontendPaths>,
): Promise<EnrichedDirectMessageContext | null> {
  const roomId = readString(payload, 'roomId');
  const actorName = readString(payload, 'actorName') || 'Someone';
  const contentSnippet = readString(payload, 'contentSnippet');
  const actorId = readString(payload, 'actorId');

  if (!roomId) {
    return null;
  }

  let actorAvatarUrl: string | null = null;
  if (actorId) {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { avatarUrl: true },
    });
    actorAvatarUrl = actor?.avatarUrl ?? null;
  }

  return {
    actorName,
    actorAvatarUrl,
    timestamp: formatCommentTimestamp(new Date()),
    contentSnippet,
    chatUrl: paths.liveChatRoom(roomId),
  };
}

export async function enrichNotificationEmail(
  prisma: PrismaService,
  data: NotificationEmailJobData,
  frontendUrl: string,
): Promise<EnrichedEmailContext> {
  const paths = buildFrontendPaths(frontendUrl);
  const context: EnrichedEmailContext = {
    frontendUrl: frontendUrl.replace(/\/$/, ''),
    settingsUrl: paths.settings,
  };

  if (data.notificationType === 'direct.message.received') {
    const directMessage = await enrichDirectMessageContext(
      prisma,
      data.payload,
      paths,
    );
    if (directMessage) {
      context.directMessage = directMessage;
    }
    return context;
  }

  if (data.notificationType === 'comment.created') {
    const comment = await enrichCommentContext(prisma, data.payload, paths);
    if (comment) {
      context.comment = comment;
    }
    return context;
  }

  const entity = await resolveEntityFromPayload(prisma, data.payload, paths);
  if (entity) {
    context.entity = entity;
  }

  return context;
}
