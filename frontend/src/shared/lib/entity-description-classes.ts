import { cn } from '@/shared/lib/utils';

export const entityDescriptionFontClass = 'font-description';

export const entityDescriptionTextClass = cn(
  entityDescriptionFontClass,
  'text-brand-gray-800 text-sm leading-relaxed whitespace-pre-wrap sm:text-base',
);

export const entityDescriptionDetailClass = cn(
  entityDescriptionTextClass,
  'max-w-full min-w-0 wrap-break-word',
);

export const entityDescriptionPreviewClass = cn(
  entityDescriptionFontClass,
  'text-brand-black text-sm leading-relaxed whitespace-pre-wrap sm:text-base',
);
