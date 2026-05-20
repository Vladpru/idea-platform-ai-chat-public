import type { IdeaDetails } from '@/features/ideas/model/idea-details.types';

import { cn } from '@/shared/lib/utils';

import { formatFileSize } from '../lib/format-file-size';
import { getAttachmentIcon } from '../lib/get-attachment-icon';

type IdeaAttachmentsTabProps = {
  attachments: IdeaDetails['attachments'];
};

export function IdeaAttachmentsTab({ attachments }: IdeaAttachmentsTabProps) {
  if (attachments.length === 0) {
    return (
      <p className="py-16 text-center text-sm font-medium text-gray-500">
        No attachments added yet.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {attachments.map(attachment => {
        const Icon = getAttachmentIcon(attachment.mimeType);

        return (
          <li key={attachment.id}>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'border-brand-gray-200 flex h-full gap-3 rounded-lg border bg-white p-4 shadow-sm',
                'transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-dark-blue focus-visible:ring-offset-2 focus-visible:outline-none',
              )}
            >
              <span className="bg-brand-gray-100 text-brand-dark-blue flex size-10 shrink-0 items-center justify-center rounded-md">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-brand-black line-clamp-2 text-sm font-semibold">
                  {attachment.filename}
                </span>
                <span className="text-brand-gray-600 mt-1 block text-xs">
                  {formatFileSize(attachment.byteSize)}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
