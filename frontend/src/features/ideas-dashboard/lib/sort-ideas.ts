import type {
  IdeaDashboardCard,
  IdeaDashboardSort,
} from '../model/ideas-dashboard.types';

export function sortIdeaDashboardCards(
  cards: IdeaDashboardCard[],
  sort: IdeaDashboardSort,
): IdeaDashboardCard[] {
  const copy = [...cards];

  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => compareDates(a.publishedAt, b.publishedAt));
    case 'title-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    case 'newest':
    default:
      return copy.sort((a, b) => compareDates(b.publishedAt, a.publishedAt));
  }
}

function compareDates(
  a: string | null,
  b: string | null,
): number {
  const timeA = a ? Date.parse(a) : 0;
  const timeB = b ? Date.parse(b) : 0;
  return timeA - timeB;
}
