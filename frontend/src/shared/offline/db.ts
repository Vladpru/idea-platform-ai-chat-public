import Dexie, { type Table } from 'dexie';

export type SyncStatus =
  | 'synced'
  | 'pending'
  | 'failed'
  | 'conflict'
  | 'pending_socket';

export interface ConflictInfo {
  serverVersion: number | null;
  serverSnapshot: Record<string, unknown> | null;
  payload: unknown;
  op: OutboxOp;
  message: string;
}

export interface SyncEnvelope {
  localId: string;
  serverId: string | null;
  syncStatus: SyncStatus;
  version: number;
  updatedAt: string;
  deleted: boolean;
  conflict?: ConflictInfo | null;
}

export interface LocalIdea extends SyncEnvelope {
  authorId: string;
  title: string | null;
  status: string;
  stage: string | null;
  snapshot: Record<string, unknown>;
}

export interface LocalProblem extends SyncEnvelope {
  authorId: string;
  title: string;
  status: string;
  stage: string | null;
  snapshot: Record<string, unknown>;
}

export interface LocalChatMessage extends SyncEnvelope {
  roomId: string;
  clientMessageId: string;
  authorId: string;
  content: string;
  createdAt: string;
  snapshot: Record<string, unknown>;
}

export interface LocalUser {
  id: string;
}

export type OutboxOp = 'create' | 'update' | 'delete' | 'upload' | 'publish';
export type OutboxEntity = 'idea' | 'problem' | 'message';
export type OutboxMediaKind = 'main' | 'attachment';
export type OutboxStatus = 'queued' | 'inflight' | 'failed' | 'dead';

export interface OutboxError {
  code?: string;
  httpStatus?: number;
  message: string;
}

export interface OutboxEntry {
  id: string;
  op: OutboxOp;
  entity: OutboxEntity;
  entityLocalId: string;
  payload: unknown;
  baseVersion: number | null;
  dependsOn: string[];
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: string;
  createdAt: string;
  lastError?: OutboxError | null;
  file?: Blob;
  fileName?: string;
  mediaKind?: OutboxMediaKind;
}

const DB_NAME = 'idea-platform-offline';

export class OfflineDB extends Dexie {
  ideas!: Table<LocalIdea, string>;
  problems!: Table<LocalProblem, string>;
  chat_messages!: Table<LocalChatMessage, string>;
  outbox!: Table<OutboxEntry, string>;
  users!: Table<LocalUser, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      ideas: 'localId, serverId, syncStatus, status, updatedAt',
      problems: 'localId, serverId, syncStatus, status, updatedAt',
      chat_messages:
        'localId, serverId, roomId, clientMessageId, syncStatus, createdAt, [roomId+createdAt]',
      outbox:
        'id, status, entity, entityLocalId, createdAt, [status+nextAttemptAt]',
    });

    this.version(2).stores({
      ideas: 'localId, serverId, authorId, syncStatus, status, updatedAt',
      problems: 'localId, serverId, authorId, syncStatus, status, updatedAt',
    });

    this.version(3).stores({
      users: 'id',
    });
  }
}

export const db = new OfflineDB();

export async function wipeOfflineData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.ideas, db.problems, db.chat_messages, db.outbox, db.users],
    async () => {
      await Promise.all([
        db.ideas.clear(),
        db.problems.clear(),
        db.chat_messages.clear(),
        db.outbox.clear(),
        db.users.clear(),
      ]);
    },
  );
}
