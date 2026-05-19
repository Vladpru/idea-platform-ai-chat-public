import { IDEA_STATUS, type CreateIdeaDraft } from '@/features/ideas/model/idea.types';

export const EMPTY_CREATE_IDEA_DRAFT: CreateIdeaDraft = {
  id: null,
  authorId: null,
  status: IDEA_STATUS.DRAFT,
  stage: 'ideation',
  title: '',
  description: '',
  problemIds: [],
  tags: [],
  publishedAt: null,
  createdAt: null,
  updatedAt: null,
};

export const EMPTY_CREATE_IDEA_FILES = {
  mainImage: null,
  attachments: [] as File[],
};
