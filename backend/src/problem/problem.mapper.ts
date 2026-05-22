import type {
  IdeaStatus,
  ProblemStage,
  ProblemStatus,
} from '../../generated/prisma/client';
import type {
  ProblemFormAuthor,
  ProblemFormResponse,
  ProblemFormTag,
  ProblemLinkedIdea,
  ProblemMediaResponse,
} from './types/problem-form.types';

export type { ProblemFormRecord } from './types/problem-form.types';

type ProblemMediaInput = {
  id: string;
  kind: ProblemMediaResponse['kind'];
  provider: ProblemMediaResponse['provider'];
  url: string;
  mimeType: string;
  byteSize: number;
  originalFilename: string;
  sortOrder: number;
  createdAt: Date;
};

type ProblemIdeaLinkInput = {
  isPrimary: boolean;
  idea: {
    id: string;
    title: string | null;
    status: IdeaStatus;
    author: ProblemFormAuthor;
  };
};

type ProblemTagLinkInput = {
  tag: ProblemFormTag;
};

type ProblemInput = {
  id: string;
  status: ProblemStatus;
  stage: ProblemStage | null;
  title: string;
  description: string;
  valueProposition: string | null;
  costBenefit: { toString(): string } | null;
  category: string | null;
  impact: string | null;
  publishedAt: Date | null;
  author: ProblemFormAuthor;
  ideas: ProblemIdeaLinkInput[];
  tags: ProblemTagLinkInput[];
  media: ProblemMediaInput[];
};

const ATTACHMENT: ProblemMediaResponse['kind'] = 'ATTACHMENT';

export function toProblemMediaResponse(
  media: ProblemMediaInput,
): ProblemMediaResponse {
  return {
    id: media.id,
    kind: media.kind,
    provider: media.provider,
    url: media.url,
    mimeType: media.mimeType,
    byteSize: media.byteSize,
    originalFilename: media.originalFilename,
    sortOrder: media.sortOrder,
    createdAt: media.createdAt.toISOString(),
  };
}

export function toProblemAuthorResponse(
  author: ProblemFormAuthor,
): ProblemFormAuthor {
  return {
    id: author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    avatarUrl: author.avatarUrl,
  };
}

function toProblemLinkedIdea(link: ProblemIdeaLinkInput): ProblemLinkedIdea {
  return {
    id: link.idea.id,
    title: link.idea.title,
    status: link.idea.status,
    isPrimary: link.isPrimary,
    author: toProblemAuthorResponse(link.idea.author),
  };
}

function toProblemFormTag(link: ProblemTagLinkInput): ProblemFormTag {
  return {
    id: link.tag.id,
    name: link.tag.name,
  };
}

export function toProblemFormResponse(
  problem: ProblemInput,
): ProblemFormResponse {
  const attachments = problem.media
    .filter(m => m.kind === ATTACHMENT)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: problem.id,
    status: problem.status,
    stage: problem.stage,
    title: problem.title,
    description: problem.description,
    valueProposition: problem.valueProposition,
    costBenefit: problem.costBenefit?.toString() ?? null,
    category: problem.category,
    impact: problem.impact,
    publishedAt: problem.publishedAt?.toISOString() ?? null,
    ideas: problem.ideas.map(toProblemLinkedIdea),
    tags: problem.tags.map(toProblemFormTag),
    attachments: attachments.map(toProblemMediaResponse),
    author: toProblemAuthorResponse(problem.author),
  };
}
