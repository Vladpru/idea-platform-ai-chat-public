import { LiveChatHubPage } from '@/features/live-chat';
import { createFileRoute } from '@tanstack/react-router';

import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/_auth/live-chats/')({
  head: () => pageDocumentHead('Live Chats'),
  component: LiveChatHubPage,
});
