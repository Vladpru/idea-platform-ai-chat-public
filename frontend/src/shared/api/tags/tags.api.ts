import { TAGS_ROUTES } from '@/shared/api/tags/tags.routes';
import type { TagListItem } from '@/shared/api/tags/tags.types';

import { api } from '@/shared/api/http';

export async function fetchTags(): Promise<TagListItem[]> {
  const { data } = await api.get<TagListItem[]>(TAGS_ROUTES.root);
  return data;
}
