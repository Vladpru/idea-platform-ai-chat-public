import { useLiveChatRoomQuery } from '@/features/live-chat/hooks/queries/use-live-chat-room-query';
import { LiveChatRoomPanel } from '@/features/live-chat/ui/room/LiveChatRoomPanel';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

type LiveChatRoomPageProps = {
  roomId: string;
};

export function LiveChatRoomPage({ roomId }: LiveChatRoomPageProps) {
  const { data: room, isLoading, isError } = useLiveChatRoomQuery(roomId);

  return (
    <div className="container mx-auto max-w-5xl bg-white p-6 md:p-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to=".."
          className="text-brand-dark-blue inline-flex w-fit items-center text-sm font-medium hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Live Chats
        </Link>
      </div>

      {isLoading && (
        <p className="text-brand-gray-500 text-sm">Loading chat room...</p>
      )}

      {isError || !room ? (
        <p className="text-brand-orange text-sm">
          This live chat room could not be found.
        </p>
      ) : (
        <>
          <header className="mb-6">
            <p className="text-brand-gray-500 text-sm tracking-wide uppercase">
              Live chat
            </p>
            <h1 className="text-brand-dark-blue text-2xl font-bold">
              {room.entity.title ?? 'Untitled'}
            </h1>
            <Link
              to={
                room.entity.type === 'ideas'
                  ? '/ideas/$ideaId'
                  : '/problems/$problemId'
              }
              params={
                room.entity.type === 'ideas'
                  ? { ideaId: room.entity.id }
                  : { problemId: room.entity.id }
              }
              className="text-brand-orange mt-2 inline-block text-sm hover:underline"
            >
              View {room.entity.type === 'ideas' ? 'idea' : 'problem'}
            </Link>
          </header>

          <LiveChatRoomPanel roomId={room.id} />
        </>
      )}
    </div>
  );
}
