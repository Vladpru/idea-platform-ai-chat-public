import {
  COMMENT_ATTACHMENT_ACCEPT,
  COMMENT_ATTACHMENT_ALLOWED_MESSAGE,
  COMMENT_ATTACHMENT_MIME_TYPES,
} from '@/features/discussion/lib/comment-attachments.constants';
import type { LiveChatAttachmentPayload } from '@/features/live-chat/api/live-chat-api.types';
import { uploadLiveChatAttachment } from '@/features/live-chat/api/live-chat.api';
import { LIVE_CHAT_MESSAGE_MAX_LENGTH } from '@/features/live-chat/lib/live-chat-message-schema';
import { compressImage } from '@/shared/offline/media-utils';
import { useFileHandler } from '@/shared/hooks/use-file-handler';
import { cn } from '@/shared/lib/utils';
import { MessageComposer } from '@/shared/ui/message-composer';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { Paperclip, X } from 'lucide-react';

type LiveChatInputProps = {
  roomId: string;
  onSend: (
    content: string,
    attachment?: LiveChatAttachmentPayload | null,
  ) => Promise<boolean>;
  disabled?: boolean;
  className?: string;
  isDuringCall?: boolean;
};

export function LiveChatInput({
  roomId,
  onSend,
  disabled = false,
  className,
  isDuringCall,
}: LiveChatInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] =
    useState<LiveChatAttachmentPayload | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const { handleFileChange, files, clearFiles, accept } = useFileHandler({
    maxFiles: 1,
    allowedMimeTypes: [...COMMENT_ATTACHMENT_MIME_TYPES],
    accept: COMMENT_ATTACHMENT_ACCEPT,
    allowedMessage: COMMENT_ATTACHMENT_ALLOWED_MESSAGE,
  });

  const latestValidFile = files[0] ?? null;

  useEffect(() => {
    if (!latestValidFile) return;

    let stale = false;

    const processAttachment = async () => {
      setIsUploading(true);

      try {
        const fileToUpload = latestValidFile.type.startsWith('image/')
          ? await compressImage(latestValidFile)
              .then(blob =>
                blob instanceof File
                  ? blob
                  : new File([blob], latestValidFile.name, {
                      type: blob.type || latestValidFile.type,
                    }),
              )
              .catch(() => latestValidFile)
          : latestValidFile;

        const result = await uploadLiveChatAttachment(roomId, fileToUpload);

        if (!stale) {
          setPendingAttachment(result);
        }
      } catch {
        if (!stale) {
          toast.error('Failed to upload attachment');
        }
      } finally {
        clearFiles();
        if (!stale) {
          setIsUploading(false);
        }
      }
    };

    void processAttachment();

    return () => {
      stale = true;
    };
  }, [latestValidFile, roomId, clearFiles]);

  const trimmedContent = content.trim();
  const hasAttachment = pendingAttachment !== null;
  const canSubmit =
    (trimmedContent.length > 0 || hasAttachment) &&
    !disabled &&
    !isSending &&
    !isUploading;

  const submit = useCallback(async () => {
    const trimmed = content.trim();
    const attachment = pendingAttachment;

    if (
      (trimmed.length === 0 && !attachment) ||
      isSending ||
      disabled ||
      isUploading
    ) {
      return;
    }

    setIsSending(true);
    try {
      console.log('Sending message...');

      const sent = await onSend(trimmed, attachment);
      console.log('Message sent:', sent);
      if (sent) {
        setContent('');
        setPendingAttachment(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } finally {
      setIsSending(false);
    }
  }, [content, disabled, isSending, isUploading, onSend, pendingAttachment]);

  const handleChange = (value: string) => {
    setContent(value.slice(0, LIVE_CHAT_MESSAGE_MAX_LENGTH));
  };

  const handleAttachClick = () => {
    if (!navigator.onLine) {
      toast.error('File uploads in chat are not supported offline');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAttachSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (!navigator.onLine) {
      toast.error('File uploads in chat are not supported offline');
      event.target.value = '';
      return;
    }
    handleFileChange(event);
  };

  const attachmentsPreview = pendingAttachment ? (
    <div className="border-border bg-muted/50 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm">
      <Paperclip
        className="text-muted-foreground size-3.5 shrink-0"
        aria-hidden
      />
      <span className="text-foreground max-w-[200px] truncate">
        {pendingAttachment.name}
      </span>
      <button
        type="button"
        onClick={() => setPendingAttachment(null)}
        className="text-muted-foreground hover:text-foreground ml-0.5 shrink-0"
        aria-label="Remove attachment"
      >
        <X className="size-3.5" />
      </button>
    </div>
  ) : undefined;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || isUploading || !isOnline}
        onChange={handleAttachSelect}
      />
      <MessageComposer
        content={content}
        onContentChange={handleChange}
        onSubmit={submit}
        canSubmit={canSubmit}
        disabled={disabled}
        placeholder={isDuringCall ? 'Message...' : 'Type your message...'}
        inputId="live-chat-message-input"
        className={cn(className)}
        showAttachButton
        attachDisabled={isUploading || !isOnline}
        isAttachLoading={isUploading}
        onAttachClick={handleAttachClick}
        attachmentsPreview={attachmentsPreview}
      />
    </>
  );
}
