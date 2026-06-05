import { FileUpIcon, Loader2 } from 'lucide-react';
import { useId, useRef } from 'react';

import { AUTO_FILL_ACCEPT } from '@/shared/lib/document-auto-fill';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

const AUTO_FILL_LABEL =
  'Upload a .docx or .pdf to auto-fill form fields with AI';
const AUTO_FILL_SCANNING_LABEL = 'Scanning document and populating fields…';

type DocumentAutoFillControlProps = {
  disabled?: boolean;
  isScanning?: boolean;
  onFileSelected: (file: File) => void;
  className?: string;
};

export function DocumentAutoFillControl({
  disabled = false,
  isScanning = false,
  onFileSelected,
  className,
}: DocumentAutoFillControlProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || isScanning;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    onFileSelected(file);
  };

  const tooltipLabel = isScanning ? AUTO_FILL_SCANNING_LABEL : AUTO_FILL_LABEL;

  return (
    <div className={cn(className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={AUTO_FILL_ACCEPT}
        className="sr-only"
        disabled={isDisabled}
        onChange={handleChange}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-brand-dark-blue text-brand-dark-blue size-10 rounded-md"
            disabled={isDisabled}
            aria-label={tooltipLabel}
            onClick={() => inputRef.current?.click()}
          >
            {isScanning ? (
              <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <FileUpIcon className="size-5 shrink-0" aria-hidden />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
}
