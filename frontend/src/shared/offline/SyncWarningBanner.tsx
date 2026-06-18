import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import { db } from './db';
import {
  type SyncEntity,
  useDiscardFailedMutation,
  useResolveConflictMutation,
  useRetrySyncMutation,
} from './use-sync-resolution';

type SyncWarningBannerProps = {
  entity: SyncEntity;
  localId: string;
};

function BannerShell({
  tone,
  title,
  detail,
  children,
}: {
  tone: 'conflict' | 'failed';
  title: string;
  detail?: string | null;
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between',
        tone === 'conflict'
          ? 'border-amber-300 bg-amber-50 text-amber-900'
          : 'border-red-300 bg-red-50 text-red-900',
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">{title}</p>
          {detail ? (
            <p className="text-xs opacity-80 break-words">{detail}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        {children}
      </div>
    </div>
  );
}

export function SyncWarningBanner({ entity, localId }: SyncWarningBannerProps) {
  const row = useLiveQuery(
    () => (entity === 'idea' ? db.ideas.get(localId) : db.problems.get(localId)),
    [entity, localId],
  );

  const failureMessage = useLiveQuery(
    async () => {
      const dead = await db.outbox
        .where('entityLocalId')
        .equals(localId)
        .filter(e => e.status === 'dead')
        .first();
      return dead?.lastError?.message ?? null;
    },
    [localId],
    null,
  );

  const resolveConflict = useResolveConflictMutation(entity);
  const retrySync = useRetrySyncMutation(entity);
  const discardFailed = useDiscardFailedMutation(entity);

  if (!row || (row.syncStatus !== 'conflict' && row.syncStatus !== 'failed')) {
    return null;
  }

  const busy =
    resolveConflict.isPending ||
    retrySync.isPending ||
    discardFailed.isPending;

  if (row.syncStatus === 'conflict') {
    return (
      <BannerShell
        tone="conflict"
        title="This item was modified on the server. Your offline changes could not be saved."
      >
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            resolveConflict.mutate({ localId, resolution: 'discard' })
          }
        >
          Discard my changes
        </Button>
        <Button
          size="sm"
          disabled={busy}
          onClick={() =>
            resolveConflict.mutate({ localId, resolution: 'force' })
          }
        >
          Force save mine
        </Button>
      </BannerShell>
    );
  }

  return (
    <BannerShell
      tone="failed"
      title="Failed to sync changes."
      detail={failureMessage ?? row.conflict?.message}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => discardFailed.mutate({ localId })}
      >
        Discard
      </Button>
      <Button
        size="sm"
        disabled={busy}
        onClick={() => retrySync.mutate({ localId })}
      >
        <RefreshCw className="size-4" />
        Retry
      </Button>
    </BannerShell>
  );
}
