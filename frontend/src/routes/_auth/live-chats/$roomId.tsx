import { LiveChatRoomPage } from '@/pages/live-chats/ui/LiveChatRoomPage';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { z } from 'zod';

import { pageDocumentHead } from '@/shared/lib/document-head';

const liveChatRoomParamsSchema = z.object({
  roomId: z.uuid(),
});

export const Route = createFileRoute('/_auth/live-chats/$roomId')({
  params: {
    parse: params => liveChatRoomParamsSchema.parse(params),
  },
  head: () => pageDocumentHead('Live Chat'),
  component: LiveChatRoomRoute,
});

function LiveChatRoomRoute() {
  const { roomId } = useParams({ from: '/_auth/live-chats/$roomId' });
  return <LiveChatRoomPage roomId={roomId} />;
}
