import { Database, RefreshCw } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import { useKbStatsQuery } from '../hooks/queries/use-kb-stats-query';

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground truncate text-[11px]">
        {label}
      </span>
      <span className="text-foreground shrink-0 text-[11px] font-medium tabular-nums">
        {value}
      </span>
    </div>
  );
}

function CoverageBar({ percent }: { percent: number }) {
  return (
    <div className="mt-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11px]">
          Embedding coverage
        </span>
        <span className="text-foreground text-[11px] font-medium tabular-nums">
          {percent}%
        </span>
      </div>
      <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percent === 100
              ? 'bg-emerald-500'
              : percent >= 80
                ? 'bg-brand-dark-blue'
                : 'bg-amber-500',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function KbStatsPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useKbStatsQuery();

  return (
    <div className="border-border border-t px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-1.5">
          <Database className="size-3.5" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            Knowledge Base
          </span>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="text-muted-foreground hover:text-foreground active:scale-90 rounded p-0.5 transition-all duration-150 disabled:opacity-40"
          aria-label="Refresh stats"
        >
          <RefreshCw
            className={cn(
              'size-3 transition-transform',
              isFetching && 'animate-[spin_0.6s_cubic-bezier(0.4,0,0.2,1)_infinite]',
            )}
          />
        </button>
      </div>

      {isLoading && (
        <div className="space-y-1.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted h-3 animate-pulse rounded" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-muted-foreground text-[11px]">
          Failed to load stats.
        </p>
      )}

      {data && (
        <div className="space-y-1">
          <StatRow
            label="Total chunks"
            value={data.totalChunks.toLocaleString()}
          />
          <StatRow label="Ideas" value={data.ideaChunks.toLocaleString()} />
          <StatRow
            label="Problems"
            value={data.problemChunks.toLocaleString()}
          />
          <StatRow
            label="Vault docs"
            value={data.vaultChunks.toLocaleString()}
          />
          {data.lastSyncedAt && (
            <StatRow
              label="Last synced"
              value={new Date(data.lastSyncedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
          )}
          <CoverageBar percent={data.embeddingCoveragePercent} />
        </div>
      )}
    </div>
  );
}
