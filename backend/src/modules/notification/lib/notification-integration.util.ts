import type { PrismaService } from '../../../core/prisma/prisma.service';

type LifecycleSnapshot = {
  status: string;
  stage: string | null;
};

export function hasLifecycleChange(
  before: LifecycleSnapshot,
  after: LifecycleSnapshot,
): boolean {
  return (
    before.status !== after.status ||
    (before.stage ?? null) !== (after.stage ?? null)
  );
}

export async function resolveActorDisplayName(
  prisma: PrismaService,
  actorId: string,
): Promise<string> {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { firstName: true, lastName: true },
  });

  if (!actor) {
    return 'Someone';
  }

  const name = [actor.firstName, actor.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name.length > 0 ? name : 'Someone';
}

export async function resolveIdeaRecipientUserIds(
  prisma: PrismaService,
  ideaId: string,
): Promise<string[]> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: {
      authorId: true,
      members: { select: { userId: true } },
    },
  });

  if (!idea) {
    return [];
  }

  const recipientIds = new Set<string>();
  recipientIds.add(idea.authorId);

  for (const member of idea.members) {
    recipientIds.add(member.userId);
  }

  return [...recipientIds];
}

export async function resolveProblemRecipientUserIds(
  prisma: PrismaService,
  problemId: string,
): Promise<string[]> {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: {
      authorId: true,
      members: { select: { userId: true } },
    },
  });

  if (!problem) {
    return [];
  }

  const recipientIds = new Set<string>();
  recipientIds.add(problem.authorId);

  for (const member of problem.members) {
    recipientIds.add(member.userId);
  }

  return [...recipientIds];
}
