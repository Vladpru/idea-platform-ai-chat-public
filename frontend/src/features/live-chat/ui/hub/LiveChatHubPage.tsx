import { useLiveChatRoomsQuery } from '@/features/live-chat/hooks/queries/use-live-chat-rooms-query';
import { LiveChatRoomListItem } from '@/features/live-chat/ui/hub/LiveChatRoomListItem';
import { lazy, Suspense, useState } from 'react';

const CreateLiveChatDialog = lazy(() =>
  import('@/features/live-chat/ui/create-dialog/CreateLiveChatDialog').then(
    module => ({ default: module.CreateLiveChatDialog }),
  ),
);

import { Button } from '@/shared/ui/button';

export function LiveChatHubPage() {
  const { data: rooms = [], isLoading, isError } = useLiveChatRoomsQuery();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="md-p-10 container mx-auto max-w-5xl bg-white p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-brand-dark-blue text-3xl font-bold">
            Live Chats
          </h1>
          <p className="text-brand-gray-600 mt-2 text-sm">
            Real-time conversations linked to ideas and problems.
          </p>
        </div>
        <Button
          type="button"
          className="bg-brand-orange hover:bg-brand-orange/90"
          onClick={() => setIsCreateOpen(true)}
        >
          Create new chat
        </Button>
      </div>

      {isLoading ? (
        <p className="text-brand-gray-500 text-sm">Loading live chats...</p>
      ) : null}

      {isError ? (
        <p className="text-brand-orange text-sm">Could not load live chats.</p>
      ) : null}

      {!isLoading && !isError && rooms.length === 0 ? (
        <div className="border-brand-gray-200 rounded-lg border border-dashed p-10 text-center">
          <p className="text-brand-gray-600 mb-4 text-sm">
            No live chats yet. Start one by linking it to an idea or problem.
          </p>
          <Button
            type="button"
            className="bg-brand-orange hover:bg-brand-orange/90"
            onClick={() => setIsCreateOpen(true)}
          >
            Create new chat
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && rooms.length > 0 ? (
        <div className="flex flex-col gap-3">
          {rooms.map(room => (
            <LiveChatRoomListItem key={room.id} room={room} />
          ))}
        </div>
      ) : null}

      {isCreateOpen ? (
        <Suspense fallback={null}>
          <CreateLiveChatDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
