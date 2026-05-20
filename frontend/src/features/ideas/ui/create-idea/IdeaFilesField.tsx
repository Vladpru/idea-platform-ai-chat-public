import {
  getAttachmentFileKey,
  MAX_ATTACHMENT_FILES,
  mergeAttachmentFiles,
} from '@/features/ideas/lib/create-idea/attachments';
import { AddImageModal } from '@/features/ideas/ui/modals/AddImageModal';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { toast } from 'sonner';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

import type { IdeaCreateFormValues } from '@/features/ideas/lib/create-idea';

import { IdeaAttachmentCard } from './IdeaAttachmentCard';

type IdeaFilesFieldProps = {
  control: Control<IdeaCreateFormValues>;
  disabled?: boolean;
};

export function IdeaFilesField({ control, disabled = false }: IdeaFilesFieldProps) {
  const [addFilesOpen, setAddFilesOpen] = useState(false);

  return (
    <Controller
      name="files"
      control={control}
      render={({ field }) => {
        const files = field.value ?? [];
        const atLimit = files.length >= MAX_ATTACHMENT_FILES;
        const remainingSlots = MAX_ATTACHMENT_FILES - files.length;

        const handleAdd = (incoming: File[]) => {
          const { merged, errors } = mergeAttachmentFiles(files, incoming);
          if (errors.length > 0) {
            errors.forEach(message => toast.error(message));
          }
          if (merged.length !== files.length) {
            field.onChange(merged);
          }
        };

        const removeFile = (key: string) => {
          field.onChange(files.filter(file => getAttachmentFileKey(file) !== key));
        };

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
              onAdd={handleAdd}
            />
          </>
        );
      }}
    />
  );
}
