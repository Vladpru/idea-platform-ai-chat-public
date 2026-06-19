import type { Prisma, PrismaClient } from '../../../generated/prisma/client';

const TAG_ID_SELECT = { tagId: true } as const;

type ProblemTagIdRow = { tagId: string };

export async function findProblemTagIds(
  client: PrismaClient | Prisma.TransactionClient,
  problemId: string,
): Promise<string[]> {
  const rows = (await (client as PrismaClient).problemTag.findMany({
    where: { problemId },
    select: TAG_ID_SELECT,
  })) as ProblemTagIdRow[];

  return rows.map(row => row.tagId);
}

export async function deleteProblemTagsExcept(
  client: PrismaClient | Prisma.TransactionClient,
  problemId: string,
  tagIdsToRemove: string[],
): Promise<void> {
  if (tagIdsToRemove.length === 0) {
    return;
  }

  await (client as PrismaClient).problemTag.deleteMany({
    where: {
      problemId,
      tagId: { in: tagIdsToRemove },
    },
  });
}

export async function createProblemTagLinks(
  client: PrismaClient | Prisma.TransactionClient,
  problemId: string,
  tagIds: string[],
): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  await (client as PrismaClient).problemTag.createMany({
    data: tagIds.map(tagId => ({
      problemId,
      tagId,
    })),
  });
}

export async function deleteAllProblemTags(
  client: PrismaClient | Prisma.TransactionClient,
  problemId: string,
): Promise<void> {
  await (client as PrismaClient).problemTag.deleteMany({
    where: { problemId },
  });
}
