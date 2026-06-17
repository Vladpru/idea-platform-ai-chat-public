import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  return md.render(markdown);
}
