import DOMPurify from 'dompurify';
import { useMemo } from 'react';

import { markdownToHtml } from '@/shared/lib/rich-text/markdown-to-html';
import { cn } from '@/shared/lib/utils';

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = useMemo(() => {
    const raw = markdownToHtml(content);
    return DOMPurify.sanitize(raw);
  }, [content]);

  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none overflow-hidden', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
