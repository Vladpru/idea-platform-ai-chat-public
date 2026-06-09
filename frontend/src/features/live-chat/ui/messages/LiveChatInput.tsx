import {
  LIVE_CHAT_MESSAGE_MAX_LENGTH,
  liveChatMessageContentSchema,
} from '@/features/live-chat/lib/live-chat-message-schema';
import { useCallback, useState } from 'react';

import { MessageComposer } from '@/shared/ui/message-composer';
import { cn } from '@/shared/lib/utils';

type LiveChatInputProps = {
  onSend: (content: string) => Promise<boolean>;
  disabled?: boolean;
  className?: string;
};

export function LiveChatInput({
  onSend,
  disabled = false,
  className,
}: LiveChatInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const trimmedContent = content.trim();
  const canSubmit = trimmedContent.length > 0 && !disabled && !isSending;

  const submit = useCallback(async () => {
    const parsed = liveChatMessageContentSchema.safeParse(content);
    if (!parsed.success || isSending || disabled) {
      return;
    }

    setIsSending(true);
    try {
      const sent = await onSend(parsed.data);
      if (sent) {
        setContent('');
      }
    } finally {
      setIsSending(false);
    }
  }, [content, disabled, isSending, onSend]);

  const handleChange = (value: string) => {
    setContent(value.slice(0, LIVE_CHAT_MESSAGE_MAX_LENGTH));
  };

  return (
    <MessageComposer
      content={content}
      onContentChange={handleChange}
      onSubmit={submit}
      canSubmit={canSubmit}
      disabled={disabled}
      placeholder="Type your message..."
      inputId="live-chat-message-input"
      className={cn(className)}
      showAttachButton
      attachDisabled
    />
  );
}
