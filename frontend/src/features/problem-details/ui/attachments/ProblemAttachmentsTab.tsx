import type { ProblemDetails } from '@/features/problem-details/model/problem-details.types';
import { FileImageIcon } from '@/assets/svg/file-image';
import { cn } from '@/shared/lib/utils';

type ProblemAttachmentsTabProps = {
  attachments: ProblemDetails['attachments'];
};

export function ProblemAttachmentsTab({
  attachments,
}: ProblemAttachmentsTabProps) {
  if (attachments.length === 0) {
    return (
      <p className="py-16 text-center text-sm font-medium text-gray-500">
        No attachments added yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-5 pt-4">
      {attachments.map(attachment => {
        const isImage = attachment.mimeType?.startsWith('image/');

        return (
          <li key={attachment.id}>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group flex items-center gap-4 outline-none',
                'focus-visible:ring-brand-dark-blue rounded focus-visible:ring-2 focus-visible:ring-offset-4',
              )}
            >
              <div className="flex w-16 shrink-0 items-center justify-center">
                {isImage ? (
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className="h-11 w-full rounded object-cover shadow-sm"
                  />
                ) : (
                  <FileImageIcon className="h-11 w-auto" />
                )}
              </div>
              <span className="truncate text-sm text-black group-hover:underline">
                {attachment.filename}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
