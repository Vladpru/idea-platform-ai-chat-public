import { MediaKind } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { IDEA_FORM_INCLUDE } from './idea.constants';
import type {
  IdeaFormAuthor,
  IdeaFormResponse,
  IdeaMediaResponse,
} from './types/idea-form.types';

export type IdeaFormRecord = Prisma.IdeaGetPayload<{
  include: typeof IDEA_FORM_INCLUDE;
}>;

export function toIdeaMediaResponse(
  media: IdeaFormRecord['media'][number],
): IdeaMediaResponse {
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

export function toIdeaAuthorResponse(
  author: IdeaFormRecord['author'],
): IdeaFormAuthor {
  return {
    id: author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    avatarUrl: author.avatarUrl,
  };
}

export function toIdeaFormResponse(idea: IdeaFormRecord): IdeaFormResponse {
  const mainImages = idea.media.filter(m => m.kind === MediaKind.MAIN_IMAGE);

  if (mainImages.length > 1) {
    console.warn(`Idea ${idea.id} has ${mainImages.length} MAIN_IMAGE entries`);
  }

  const mainImage = mainImages[0] ?? null;
  const attachments = idea.media
    .filter(m => m.kind === MediaKind.ATTACHMENT)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: idea.id,
    status: idea.status,
    stage: idea.stage,
    title: idea.title,
    description: idea.description,
    publishedAt: idea.publishedAt?.toISOString() ?? null,
    problems: idea.problems.map(({ problem, isPrimary }) => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      status: problem.status,
      isPrimary,
    })),
    tags: idea.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
    })),
    mainImage: mainImage ? toIdeaMediaResponse(mainImage) : null,
    attachments: attachments.map(toIdeaMediaResponse),
    author: toIdeaAuthorResponse(idea.author),
  };
}
