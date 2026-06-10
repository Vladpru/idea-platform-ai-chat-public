import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';
import { useLiveChatRoomsQuery } from '@/features/live-chat/hooks/queries/use-live-chat-rooms-query';
import { liveChatEntityLabel } from '@/features/live-chat/lib/live-chat-entity-type';
import {
  type LiveChatHubFilter,
  LiveChatHubTypeFilter,
} from '@/features/live-chat/ui/hub/LiveChatHubTypeFilter';
import { LiveChatRoomListItem } from '@/features/live-chat/ui/hub/LiveChatRoomListItem';
import { Suspense, lazy, useMemo, useState } from 'react';

const CreateLiveChatDialog = lazy(() =>
  import('@/features/live-chat/ui/create-dialog/CreateLiveChatDialog').then(
    module => ({ default: module.CreateLiveChatDialog }),
  ),
);

function countByType(
  rooms: { entity: { type: LiveChatEntityType } }[],
  type: LiveChatEntityType,
): number {
  return rooms.filter(room => room.entity.type === type).length;
}

export function LiveChatHubPage() {
  const { data: rooms = [], isLoading, isError } = useLiveChatRoomsQuery();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LiveChatHubFilter>('all');

  const filterCounts = useMemo(
    () => ({
      all: rooms.length,
      users: countByType(rooms, 'users'),
      ideas: countByType(rooms, 'ideas'),
      problems: countByType(rooms, 'problems'),
    }),
    [rooms],
  );

  const filteredRooms = useMemo(() => {
    if (activeFilter === 'all') {
      return rooms;
    }

    return rooms.filter(room => room.entity.type === activeFilter);
  }, [activeFilter, rooms]);

  const emptyFilterLabel =
    activeFilter === 'all'
      ? 'live chats'
      : `${liveChatEntityLabel(activeFilter).toLowerCase()} chats`;

  return (
    <div className="md-p-10 container mx-auto max-w-5xl bg-white p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-brand-dark-blue text-3xl font-bold">Live Chats</h1>
        <p className="text-brand-gray-600 mt-2 text-sm">
          Real-time conversations with people, ideas, and problems.
        </p>
      </div>

      {!isLoading && !isError && rooms.length > 0 ? (
        <div className="mb-6">
          <LiveChatHubTypeFilter
            value={activeFilter}
            onChange={setActiveFilter}
            counts={filterCounts}
          />
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-brand-gray-500 text-sm">Loading live chats...</p>
      ) : null}

      {isError ? (
        <p className="text-brand-orange text-sm">Could not load live chats.</p>
      ) : null}

      {!isLoading && !isError && rooms.length === 0 ? (
        <div className="border-brand-gray-200 rounded-lg border border-dashed p-10 text-center">
          <p className="text-brand-gray-600 mb-4 text-sm">
            No live chats yet. Start one from a profile, idea, or problem.
          </p>
        </div>
      ) : null}

      {!isLoading &&
      !isError &&
      rooms.length > 0 &&
      filteredRooms.length === 0 ? (
        <div className="border-brand-gray-200 rounded-lg border border-dashed p-10 text-center">
          <p className="text-brand-gray-600 text-sm">
            No {emptyFilterLabel} yet.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && filteredRooms.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredRooms.map(room => (
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
