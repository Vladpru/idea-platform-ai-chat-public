import type { Prisma, PrismaClient } from '../../../generated/prisma/client';

const PUBLIC_ID_SELECT = { publicId: true } as const;

type ProblemMediaPublicIdRow = { publicId: string };

export async function findProblemMediaPublicIds(
  client: PrismaClient | Prisma.TransactionClient,
  problemId: string,
): Promise<string[]> {
  const rows = (await (client as PrismaClient).problemMedia.findMany({
    where: { problemId },
    select: PUBLIC_ID_SELECT,
  })) as ProblemMediaPublicIdRow[];

  return rows.map(row => row.publicId);
}

export async function deleteAllProblemMedia(
  client: PrismaClient | Prisma.TransactionClient,
  problemId: string,
): Promise<void> {
  await (client as PrismaClient).problemMedia.deleteMany({
    where: { problemId },
  });
}
