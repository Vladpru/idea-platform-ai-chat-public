import {
  IdeaStatus,
  type Prisma,
  ProblemStatus,
} from '../../../../../generated/prisma/client';

export function visibleIdeaWhere(userId: string): Prisma.IdeaWhereInput {
  return { OR: [{ status: IdeaStatus.PUBLISHED }, { authorId: userId }] };
}

export function visibleProblemWhere(userId: string): Prisma.ProblemWhereInput {
  return { OR: [{ status: ProblemStatus.PUBLISHED }, { authorId: userId }] };
}
