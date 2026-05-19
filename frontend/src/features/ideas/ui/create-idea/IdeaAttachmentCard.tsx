import fileImageSvg from '@/assets/svg/file-image.svg';
import { isImageAttachment } from '@/features/ideas/lib/create-idea/attachments';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';

type IdeaAttachmentCardProps = {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
};

export function IdeaAttachmentCard({
  file,
  onRemove,
  disabled = false,
}: IdeaAttachmentCardProps) {
  const isImage = isImageAttachment(file);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div
      className={cn(
        'border-brand-gray-200 relative size-20 shrink-0 overflow-hidden rounded-md border bg-white',
        disabled && 'opacity-60',
      )}
      title={file.name}
    >
      {isImage && previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 px-1 py-2">
          <img src={fileImageSvg} alt="" className="size-11 shrink-0" aria-hidden />
          <span className="text-brand-gray-700 line-clamp-2 w-full text-center text-[10px] leading-tight font-medium">
            {file.name}
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="border-brand-gray-300 text-brand-gray-700 hover:bg-brand-gray-50 absolute top-1 right-1 flex size-5 items-center justify-center rounded-full border bg-white shadow-sm transition-colors disabled:pointer-events-none"
        aria-label={`Remove ${file.name}`}
      >
        <X className="size-3" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
