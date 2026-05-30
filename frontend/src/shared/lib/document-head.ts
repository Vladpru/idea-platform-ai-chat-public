export const APP_TITLE = 'Idea Platform';

export const APP_FAVICON = '/favicon.svg';

export const APP_FAVICON_LINKS = [
  { rel: 'icon', type: 'image/svg+xml', href: APP_FAVICON },
] as const;

export function formatPageTitle(pageTitle: string): string {
  return pageTitle ? `${pageTitle} | ${APP_TITLE}` : APP_TITLE;
}

export function pageDocumentHead(pageTitle: string) {
  return {
    meta: [{ title: formatPageTitle(pageTitle) }],
    links: [...APP_FAVICON_LINKS],
  };
}
