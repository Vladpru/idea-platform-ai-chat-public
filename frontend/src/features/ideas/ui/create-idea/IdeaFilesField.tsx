import {
  ATTACHMENT_ACCEPT,
  IDEA_ATTACHMENT_ALLOWED_MIME_TYPES,
  MAX_ATTACHMENT_FILES,
  getAttachmentFileKey,
  isAllowedAttachment,
} from '@/features/ideas/lib/create-idea/attachments';
import { AddImageModal } from '@/features/ideas/ui/modals/AddImageModal';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { IdeaCreateFormValues } from '@/features/ideas/lib/create-idea';
import { useFileHandler } from '@/shared/hooks/use-file-handler';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { IdeaAttachmentCard } from './IdeaAttachmentCard';

type IdeaFilesFieldProps = {
  control: Control<IdeaCreateFormValues>;
  disabled?: boolean;
};

type IdeaFilesFieldContentProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled: boolean;
};

function IdeaFilesFieldContent({
  files,
  onFilesChange,
  disabled,
}: IdeaFilesFieldContentProps) {
  const [addFilesOpen, setAddFilesOpen] = useState(false);

  const { addFiles, removeFile, atLimit } = useFileHandler({
    maxFiles: MAX_ATTACHMENT_FILES,
    allowedMimeTypes: [...IDEA_ATTACHMENT_ALLOWED_MIME_TYPES],
    accept: ATTACHMENT_ACCEPT,
    allowedMessage: 'Only images, PDF, and DOCX files are allowed',
    validateAllowed: isAllowedAttachment,
    files,
    onFilesChange,
  });

  const remainingSlots = MAX_ATTACHMENT_FILES - files.length;

  return (
    <>
      <div className="mt-2 flex flex-wrap items-start gap-3 pt-2 pr-2">
        {files.map(file => {
          const key = getAttachmentFileKey(file);
          return (
            <IdeaAttachmentCard
              key={key}
              file={file}
              disabled={disabled}
              onRemove={() => removeFile(key)}
            />
          );
        })}

        {atLimit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled
                  className="border-brand-dark-blue text-brand-dark-blue size-20 rounded-md"
                  tabIndex={-1}
                  aria-label="Add files"
                >
                  <Upload className="size-5" aria-hidden />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              You can add up to {MAX_ATTACHMENT_FILES} files
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              'border-brand-dark-blue text-brand-dark-blue size-20 rounded-md',
            )}
            aria-label="Add files"
            disabled={disabled}
            onClick={() => setAddFilesOpen(true)}
          >
            <Upload className="size-5" aria-hidden />
          </Button>
        )}
      </div>

      <AddImageModal
        open={addFilesOpen}
        onOpenChange={setAddFilesOpen}
        maxFiles={remainingSlots}
        onAdd={addFiles}
      />
    </>
  );
}

export function IdeaFilesField({
  control,
  disabled = false,
}: IdeaFilesFieldProps) {
  return (
    <Controller
      name="files"
      control={control}
      render={({ field }) => (
        <IdeaFilesFieldContent
          files={field.value ?? []}
          onFilesChange={field.onChange}
          disabled={disabled}
        />
      )}
    />
  );
}
