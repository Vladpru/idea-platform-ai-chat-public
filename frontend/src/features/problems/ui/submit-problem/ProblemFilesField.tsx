import {
  MAX_ATTACHMENT_FILES,
  mergeAttachmentFiles,
  getAttachmentFileKey,
} from '@/features/ideas/lib/create-idea/attachments';
import { IdeaAttachmentCard } from '@/features/ideas/ui/create-idea/IdeaAttachmentCard';
import { AddImageModal } from '@/features/ideas/ui/modals/AddImageModal';
import type { SubmitProblemFormValues } from '@/features/problems/lib/submit-problem';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

type ProblemFilesFieldProps = {
  control: Control<SubmitProblemFormValues>;
  disabled?: boolean;
};

export function ProblemFilesField({
  control,
  disabled = false,
}: ProblemFilesFieldProps) {
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
          field.onChange(
            files.filter(file => getAttachmentFileKey(file) !== key),
          );
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
                    onRemove={() => removeFile(key)}
                    disabled={disabled}
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
                  className="border-brand-dark-blue text-brand-dark-blue size-20 rounded-md"
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
