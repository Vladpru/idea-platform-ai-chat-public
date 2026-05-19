import { mergeAttachmentFiles } from '@/features/ideas/lib/create-idea/attachments';
import {
  GENERATE_DRAFT_SOON_TOOLTIP,
  primaryBtnClass,
  publishBtnClass,
} from '@/features/ideas/lib/styles';
import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';
import { cancelOutlineBtn } from '@/features/profile/ui/profile-view-classes';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

type TabId = 'upload' | 'generate';

type AddImageModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (files: File[]) => void;
  maxFiles: number;
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'generate', label: 'Generate with AI' },
];

export function AddImageModal({
  open,
  onOpenChange,
  onAdd,
  maxFiles,
}: AddImageModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('upload');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const addIncomingFiles = (incoming: File[]) => {
    const { merged, errors } = mergeAttachmentFiles(
      pendingFiles,
      incoming,
      maxFiles,
    );
    errors.forEach(msg => toast.error(msg));
    setPendingFiles(merged);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setActiveTab('upload');
      setPendingFiles([]);
    }
    onOpenChange(next);
  };

  const handleAdd = () => {
    if (!pendingFiles.length) return;
    onAdd(pendingFiles);
    handleOpenChange(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': [],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    multiple: true,
    onDrop: addIncomingFiles,
  });

  const canAdd = activeTab === 'upload' && pendingFiles.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="border-brand-gray-200 max-w-lg gap-0 rounded-lg border bg-white p-0 shadow-xl sm:max-w-[520px]"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div className="relative p-6 md:p-8">
          <button
            type="button"
            className="text-brand-dark-blue hover:bg-muted focus-visible:ring-ring absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Close"
            onClick={() => handleOpenChange(false)}
          >
            <X className="size-5" aria-hidden />
          </button>

          <DialogHeader className="space-y-0 pr-8 text-left">
            <DialogTitle className="text-brand-gray-900 text-xl font-bold">
              Add files
            </DialogTitle>
            <p className="text-brand-gray-600 mt-1 text-sm">
              Images, PDF, or DOCX — up to 5 MB each
            </p>
          </DialogHeader>

          <div className="border-brand-gray-200 mt-6 border-b" role="tablist">
            <div className="flex gap-6">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative inline-flex items-center gap-1.5 pb-3 text-xs font-bold tracking-wide uppercase transition-colors',
                    activeTab === tab.id
                      ? 'text-brand-dark-blue'
                      : 'text-brand-gray-900 hover:text-brand-dark-blue/80',
                  )}
                >
                  {tab.id === 'generate' && (
                    <SparklesIcon className="size-3.5 shrink-0" />
                  )}
                  {tab.label}
                  {activeTab === tab.id ? (
                    <motion.div
                      layoutId="add-files-tab-underline"
                      className="bg-brand-accent absolute inset-x-0 -bottom-px z-10 h-[3px]"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 40,
                      }}
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 min-h-[220px]">
            <AnimatePresence mode="wait">
              {activeTab === 'upload' ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-brand-gray-200 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-white px-4 py-8 text-center transition-colors outline-none',
                      isDragActive &&
                        'border-brand-dark-blue bg-brand-gray-100',
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload
                      className="text-brand-dark-blue mb-3 size-10"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <p className="text-brand-gray-700 text-sm font-medium">
                      Choose or Drag and Drop Files
                    </p>
                    {pendingFiles.length > 0 && (
                      <ul className="text-brand-gray-600 mt-4 max-h-28 w-full space-y-1 overflow-y-auto text-left text-xs">
                        {pendingFiles.map(file => (
                          <li
                            key={`${file.name}-${file.size}`}
                            className="truncate px-2"
                          >
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="border-brand-gray-200 flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed bg-white px-4 py-10 text-center"
                >
                  <SparklesIcon className="text-brand-dark-blue mb-3 size-10" />
                  <p className="text-brand-gray-700 max-w-xs text-sm font-medium">
                    {GENERATE_DRAFT_SOON_TOOLTIP}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className={cancelOutlineBtn}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            {canAdd ? (
              <Button
                type="button"
                className={primaryBtnClass}
                onClick={handleAdd}
              >
                Add {pendingFiles.length === 1 ? 'file' : 'files'}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      type="button"
                      disabled
                      className={publishBtnClass}
                      tabIndex={-1}
                    >
                      Add files
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {activeTab === 'generate'
                    ? GENERATE_DRAFT_SOON_TOOLTIP
                    : 'Choose at least one file to add'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
