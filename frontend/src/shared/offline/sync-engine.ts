import { isAxiosError } from 'axios';

import {
  type CreateIdeaBody,
  type CreateProblemBody,
  type ServerIdea,
  type ServerProblem,
  type UpdateIdeaBody,
  type UpdateProblemBody,
  createIdea,
  createProblem,
  publishIdea,
  updateIdeaDraft,
  updateProblem,
  updatePublishedIdea,
  uploadIdeaAttachment,
  uploadIdeaMainImage,
  uploadProblemAttachment,
} from './api';
import {
  db,
  type ConflictInfo,
  type LocalIdea,
  type LocalProblem,
  type OutboxEntry,
  type OutboxError,
} from './db';

const MAX_ATTEMPTS = 8;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 5 * 60 * 1_000;

function computeBackoffMs(attempts: number): number {
  const exp = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempts);
  const jitter = Math.random() * exp * 0.25;
  return exp + jitter;
}

export async function drain(): Promise<void> {
  await navigator.locks.request(
    'outbox-drain',
    { ifAvailable: true },
    async (lock: Lock | null) => {
      if (!lock) return;

      await db.outbox
        .where('status')
        .equals('inflight')
        .modify({ status: 'queued' });

      const now = new Date().toISOString();
      const queued = await db.outbox.where('status').equals('queued').toArray();
      const eligible = queued
        .filter(entry => entry.nextAttemptAt <= now)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      for (const entry of eligible) {
        const fresh = await db.outbox.get(entry.id);
        if (!fresh || fresh.status !== 'queued') continue;
        await processEntry(fresh);
      }
    },
  );
}

async function processEntry(entry: OutboxEntry): Promise<void> {
  if (entry.entity === 'message') return;

  let row: LocalIdea | LocalProblem | undefined;

  if (entry.op !== 'create') {
    row = await getRow(entry);
    if (!row) {
      await markDead(entry, {
        message: 'Target entity missing from local store',
      });
      return;
    }
    if (!row.serverId) return;
  }

  await db.outbox.update(entry.id, { status: 'inflight' });

  try {
    if (entry.op === 'upload') {
      await uploadEntryMedia(entry, row as LocalIdea | LocalProblem);
      await db.outbox.delete(entry.id);
      return;
    }
    if (entry.op === 'publish') {
      const server = await publishEntry(entry, row as LocalIdea);
      await markSynced(entry, server);
      return;
    }
    const server = await callApi(entry, row);
    await markSynced(entry, server);
  } catch (err) {
    await onError(entry, err);
  }
}

async function uploadEntryMedia(
  entry: OutboxEntry,
  row: LocalIdea | LocalProblem,
): Promise<void> {
  if (!entry.file) return;
  const serverId = row.serverId as string;
  const file =
    entry.file instanceof File
      ? entry.file
      : new File([entry.file], entry.fileName ?? 'upload');
  if (entry.entity === 'problem') {
    await uploadProblemAttachment(serverId, file);
    return;
  }
  if (entry.mediaKind === 'main') {
    await uploadIdeaMainImage(serverId, file);
  } else {
    await uploadIdeaAttachment(serverId, file);
  }
}

async function publishEntry(
  entry: OutboxEntry,
  idea: LocalIdea,
): Promise<ServerIdea> {
  const serverId = idea.serverId as string;
  const fields = (entry.payload ?? {}) as UpdateIdeaBody;
  if (Object.keys(fields).length > 0) {
    const saved = await updateIdeaDraft(serverId, idea.version, fields);
    await db.ideas.update(entry.entityLocalId, { version: saved.version });
  }
  return publishIdea(serverId);
}

async function callApi(
  entry: OutboxEntry,
  row: LocalIdea | LocalProblem | undefined,
): Promise<ServerIdea | ServerProblem> {
  if (entry.entity === 'idea') {
    if (entry.op === 'create') {
      return createIdea(entry.payload as CreateIdeaBody);
    }
    const idea = row as LocalIdea;
    const serverId = idea.serverId as string;
    return idea.status === 'PUBLISHED'
      ? updatePublishedIdea(
          serverId,
          idea.version,
          entry.payload as UpdateIdeaBody,
        )
      : updateIdeaDraft(
          serverId,
          idea.version,
          entry.payload as UpdateIdeaBody,
        );
  }

  if (entry.op === 'create') {
    return createProblem(entry.payload as CreateProblemBody);
  }
  const problem = row as LocalProblem;
  return updateProblem(
    problem.serverId as string,
    problem.version,
    entry.payload as UpdateProblemBody,
  );
}

async function markSynced(
  entry: OutboxEntry,
  server: ServerIdea | ServerProblem,
): Promise<void> {
  const at = new Date().toISOString();

  if (entry.entity === 'idea') {
    const s = server as ServerIdea;
    await db.transaction('rw', db.ideas, db.outbox, async () => {
      await db.ideas.update(entry.entityLocalId, {
        serverId: s.id,
        version: s.version,
        syncStatus: 'synced',
        status: s.status,
        stage: s.stage ?? null,
        title: s.title ?? null,
        snapshot: s as unknown as Record<string, unknown>,
        updatedAt: at,
        deleted: false,
        conflict: null,
      });
      await db.outbox.delete(entry.id);
    });
    return;
  }

  const s = server as ServerProblem;
  await db.transaction('rw', db.problems, db.outbox, async () => {
    await db.problems.update(entry.entityLocalId, {
      serverId: s.id,
      version: s.version,
      syncStatus: 'synced',
      status: s.status,
      stage: s.stage ?? null,
      title: s.title,
      snapshot: s as unknown as Record<string, unknown>,
      updatedAt: at,
      deleted: false,
      conflict: null,
    });
    await db.outbox.delete(entry.id);
  });
}

async function onError(entry: OutboxEntry, err: unknown): Promise<void> {
  if (isAxiosError(err) && err.response) {
    const status = err.response.status;
    const data = err.response.data as
      | { current?: unknown; code?: string; message?: string }
      | undefined;
    const lastError: OutboxError = {
      httpStatus: status,
      code: data?.code,
      message: extractMessage(err),
    };

    if (status === 412) {
      await markConflict(entry, data?.current);
      return;
    }
    if (status === 409) {
      await markDead(entry, lastError);
      return;
    }
    if (status >= 400 && status < 500) {
      await markDead(entry, lastError);
      return;
    }
    await scheduleRetry(entry, lastError);
    return;
  }

  await scheduleRetry(entry, { message: extractMessage(err) });
}

async function markConflict(
  entry: OutboxEntry,
  current: unknown,
): Promise<void> {
  const at = new Date().toISOString();
  const c =
    current && typeof current === 'object'
      ? (current as Record<string, unknown> & { version?: number })
      : null;

  const conflict: ConflictInfo = {
    serverVersion: typeof c?.version === 'number' ? c.version : null,
    serverSnapshot: c,
    payload: entry.payload,
    op: entry.op,
    message: 'This item was modified on the server.',
  };

  await runEntityTx(entry, async () => {
    await updateRow(entry, { syncStatus: 'conflict', conflict, updatedAt: at });
    await db.outbox.delete(entry.id);
  });
}

async function markDead(
  entry: OutboxEntry,
  lastError: OutboxError,
): Promise<void> {
  const at = new Date().toISOString();
  await runEntityTx(entry, async () => {
    await updateRow(entry, { syncStatus: 'failed', updatedAt: at });
    await db.outbox.update(entry.id, {
      status: 'dead',
      lastError,
      nextAttemptAt: at,
    });
  });
}

async function scheduleRetry(
  entry: OutboxEntry,
  lastError: OutboxError,
): Promise<void> {
  const attempts = entry.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await markDead(entry, lastError);
    return;
  }
  const nextAttemptAt = new Date(
    Date.now() + computeBackoffMs(attempts),
  ).toISOString();
  await db.outbox.update(entry.id, {
    status: 'queued',
    attempts,
    nextAttemptAt,
    lastError,
  });
}

function getRow(
  entry: OutboxEntry,
): Promise<LocalIdea | LocalProblem | undefined> {
  return entry.entity === 'problem'
    ? db.problems.get(entry.entityLocalId)
    : db.ideas.get(entry.entityLocalId);
}

function runEntityTx(
  entry: OutboxEntry,
  fn: () => Promise<void>,
): Promise<void> {
  const table = entry.entity === 'problem' ? db.problems : db.ideas;
  return db.transaction('rw', [table, db.outbox], fn);
}

async function updateRow(
  entry: OutboxEntry,
  changes: Record<string, unknown>,
): Promise<void> {
  if (entry.entity === 'problem') {
    await db.problems.update(
      entry.entityLocalId,
      changes as Partial<LocalProblem>,
    );
  } else {
    await db.ideas.update(entry.entityLocalId, changes as Partial<LocalIdea>);
  }
}

function extractMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

export function registerSyncTriggers(options?: {
  intervalMs?: number;
}): () => void {
  const intervalMs = options?.intervalMs ?? 15_000;

  const onOnline = (): void => void drain();
  const onVisible = (): void => {
    if (document.visibilityState === 'visible') void drain();
  };
  const timer = window.setInterval(() => {
    if (navigator.onLine) void drain();
  }, intervalMs);

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);

  void drain();

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(timer);
  };
}
