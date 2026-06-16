import TurndownService from 'turndown';

function createTurndown(): TurndownService {
  return new TurndownService({ headingStyle: 'atx' });
}

const td = createTurndown();

function stripUnsupportedTags(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc
    .querySelectorAll('table,thead,tbody,tr,th,td,iframe,script,style')
    .forEach(el => el.remove());
  doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
  return doc.body.innerHTML;
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return td.turndown(html);
}

export function htmlToMarkdownPaste(html: string): string {
  if (!html) return '';
  return td.turndown(stripUnsupportedTags(html));
}
