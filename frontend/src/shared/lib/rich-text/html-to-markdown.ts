import TurndownService from 'turndown';

function createTurndown(): TurndownService {
  const service = new TurndownService({ headingStyle: 'atx' });

  service.addRule('heading', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement(content, node) {
      const level = Number((node as HTMLElement).tagName.charAt(1));
      const prefix = '#'.repeat(level);
      return `\n\n${prefix} ${content}\n\n`;
    },
  });

  return service;
}

const td = createTurndown();

function stripUnsupportedTags(html: string): string {
  return html
    .replace(/<(table|thead|tbody|tr|th|td|iframe|script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/\s+style="[^"]*"/gi, '');
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return td.turndown(html);
}

export function htmlToMarkdownPaste(html: string): string {
  if (!html) return '';
  return td.turndown(stripUnsupportedTags(html));
}
