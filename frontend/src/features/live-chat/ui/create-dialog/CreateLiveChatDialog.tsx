import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';
import { useCreateLiveChatRoomMutation } from '@/features/live-chat/hooks/mutations/use-create-live-chat-room-mutation';
import { useLiveChatEntityOptionsQuery } from '@/features/live-chat/hooks/queries/use-live-chat-entity-options-query';
import { liveChatEntityLabel } from '@/features/live-chat/lib/live-chat-entity-type';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

type CreateLiveChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateLiveChatDialog({
  open,
  onOpenChange,
}: CreateLiveChatDialogProps) {
  const navigate = useNavigate();
  const [entityType, setEntityType] = useState<LiveChatEntityType>('ideas');
  const [search, setSearch] = useState('');
  const createRoomMutation = useCreateLiveChatRoomMutation();

  const { data: options = [], isLoading } = useLiveChatEntityOptionsQuery(
    entityType,
    open,
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter(option => option.title.toLowerCase().includes(query));
  }, [options, search]);

  const handleSelect = async (entityId: string) => {
    const room = await createRoomMutation.mutateAsync({
      entityType,
      entityId,
    });
    onOpenChange(false);
    setSearch('');
    void navigate({
      to: '/live-chats/$roomId',
      params: { roomId: room.id },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new live chat</DialogTitle>
          <DialogDescription>
            Choose an idea or problem to discuss in real time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {(['ideas', 'problems'] as const).map(type => (
            <Button
              key={type}
              type="button"
              variant={entityType === type ? 'default' : 'outline'}
              className={cn(
                entityType === type &&
                  'bg-brand-orange hover:bg-brand-orange/90',
              )}
              onClick={() => setEntityType(type)}
            >
              {liveChatEntityLabel(type)}s
            </Button>
          ))}
        </div>

        <Input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={`Search ${entityType}...`}
        />

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {isLoading ? (
            <p className="text-brand-gray-500 text-sm">Loading options...</p>
          ) : null}

          {!isLoading && filteredOptions.length === 0 ? (
            <p className="text-brand-gray-500 text-sm">
              No matching {entityType} found.
            </p>
          ) : null}

          {filteredOptions.map(option => (
            <button
              key={option.id}
              type="button"
              disabled={createRoomMutation.isPending}
              onClick={() => void handleSelect(option.id)}
              className="border-brand-gray-200 hover:border-brand-orange/40 w-full rounded-lg border px-4 py-3 text-left transition-colors"
            >
              <span className="text-brand-dark-blue block font-medium">
                {option.title}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
