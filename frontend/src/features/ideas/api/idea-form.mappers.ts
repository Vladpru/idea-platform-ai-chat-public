import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import type { IdeaApi } from '@/features/ideas/model/idea.types';

/** Maps form API payload to legacy `IdeaApi` shape used by create-idea mappers. */
export function ideaFormDtoToIdeaApi(dto: IdeaFormResponseDto): IdeaApi {
  return {
    id: dto.id,
    authorId: dto.author.id,
    status: dto.status,
    stage: (dto.stage?.toLowerCase() ?? null) as IdeaApi['stage'],
    title: dto.title,
    description: dto.description,
    publishedAt: dto.publishedAt,
    createdAt: dto.publishedAt ?? '',
    updatedAt: dto.publishedAt ?? '',
    problems: dto.problems.map(problem => ({
      id: problem.id,
      problemId: problem.id,
    })),
    tags: dto.tags.map(tag => ({
      id: tag.id,
      tagId: tag.id,
      label: tag.name,
    })),
    media: [
      ...(dto.mainImage
        ? [{ id: dto.mainImage.id, url: dto.mainImage.url, kind: 'main' as const }]
        : []),
      ...dto.attachments.map(item => ({
        id: item.id,
        url: item.url,
        kind: 'attachment' as const,
      })),
    ],
  };
}
