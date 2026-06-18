import type { CreateIdeaBody, CreateProblemBody } from './api';
import {
  db,
  type LocalIdea,
  type LocalProblem,
  type OutboxEntity,
  type OutboxEntry,
  type OutboxMediaKind,
  type OutboxOp,
} from './db';
import { uuidv7 } from './id';
import { prepareUploadFile } from './media-utils';

export interface CreateIdeaInput {
  authorId: string;
  isPublished?: boolean;
  title?: string;
  description?: string;
  stage?: string;
  problemIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
  mainImage?: File | null;
  attachments?: File[];
}

export interface UpdateIdeaInput {
  title?: string;
  description?: string;
  stage?: string;
  problemIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
  mainImage?: File | null;
  attachments?: File[];
}

export interface CreateProblemInput {
  authorId: string;
  isPublished?: boolean;
  title?: string;
  description?: string;
  stage?: string;
  valueProposition?: string;
  costBenefit?: string;
  category?: string;
  impact?: string;
  ideaIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
}

export interface UpdateProblemInput {
  title?: string;
  description?: string;
  stage?: string;
  valueProposition?: string;
  costBenefit?: string;
  category?: string;
  impact?: string;
  ideaIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
  attachments?: File[];
}

export interface MirrorIdeaInput {
  id: string;
  version: number;
  authorId: string;
  title: string | null;
  status: string;
  stage: string | null;
  snapshot: Record<string, unknown>;
}

export interface MirrorProblemInput {
  id: string;
  version: number;
  authorId: string;
  title: string;
  status: string;
  stage: string | null;
  snapshot: Record<string, unknown>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

function buildEntry(
  op: OutboxOp,
  entity: OutboxEntity,
  entityLocalId: string,
  payload: unknown,
  baseVersion: number | null,
  createdAt: string,
  dependsOn: string[] = [],
): OutboxEntry {
  return {
    id: uuidv7(),
    op,
    entity,
    entityLocalId,
    payload,
    baseVersion,
    dependsOn,
    status: 'queued',
    attempts: 0,
    nextAttemptAt: createdAt,
    createdAt,
    lastError: null,
  };
}

async function coalesceOrEnqueueUpdate(
  entity: OutboxEntity,
  entityLocalId: string,
  patch: Record<string, unknown>,
  baseVersion: number,
  at: string,
): Promise<void> {
  const queued = await db.outbox
    .where('entityLocalId')
    .equals(entityLocalId)
    .filter(e => e.status === 'queued')
    .toArray();

  const target =
    queued.find(e => e.op === 'create') ?? queued.find(e => e.op === 'update');

  if (target) {
    const mergedPayload = {
      ...(target.payload as Record<string, unknown>),
      ...stripUndefined(patch),
    };
    await db.outbox.update(target.id, { payload: mergedPayload });
    return;
  }

  await db.outbox.add(
    buildEntry(
      'update',
      entity,
      entityLocalId,
      stripUndefined(patch),
      baseVersion,
      at,
    ),
  );
}

async function buildMediaEntry(
  entityLocalId: string,
  entity: OutboxEntity,
  mediaKind: OutboxMediaKind,
  file: File,
): Promise<OutboxEntry> {
  const prepared = await prepareUploadFile(file);
  const at = nowIso();
  return {
    id: uuidv7(),
    op: 'upload',
    entity,
    entityLocalId,
    payload: null,
    baseVersion: null,
    dependsOn: [entityLocalId],
    status: 'queued',
    attempts: 0,
    nextAttemptAt: at,
    createdAt: at,
    lastError: null,
    file: prepared,
    fileName: prepared.name,
    mediaKind,
  };
}

async function buildMediaEntries(
  entityLocalId: string,
  entity: OutboxEntity,
  mainImage: File | null | undefined,
  attachments: File[] | undefined,
): Promise<OutboxEntry[]> {
  const entries: OutboxEntry[] = [];
  if (mainImage) {
    entries.push(
      await buildMediaEntry(entityLocalId, entity, 'main', mainImage),
    );
  }
  for (const file of attachments ?? []) {
    entries.push(
      await buildMediaEntry(entityLocalId, entity, 'attachment', file),
    );
  }
  return entries;
}

export async function createIdea(input: CreateIdeaInput): Promise<LocalIdea> {
  const localId = uuidv7();
  const at = nowIso();
  const isPublished = input.isPublished ?? false;

  const row: LocalIdea = {
    localId,
    serverId: null,
    syncStatus: 'pending',
    version: 0,
    updatedAt: at,
    deleted: false,
    authorId: input.authorId,
    title: input.title ?? null,
    status: isPublished ? 'PUBLISHED' : 'DRAFT',
    stage: input.stage ?? null,
    snapshot: {
      id: localId,
      version: 0,
      status: isPublished ? 'PUBLISHED' : 'DRAFT',
      stage: input.stage ?? null,
      title: input.title ?? null,
      description: input.description ?? null,
      authorId: input.authorId,
      createdAt: at,
      updatedAt: at,
      pendingSync: true,
    },
  };

  const body: CreateIdeaBody = {
    id: localId,
    isPublished,
    ...stripUndefined({
      title: input.title,
      description: input.description,
      stage: input.stage,
      problemIds: input.problemIds,
      tagIds: input.tagIds,
      tagLabels: input.tagLabels,
    }),
  };

  const mediaEntries = await buildMediaEntries(
    localId,
    'idea',
    input.mainImage,
    input.attachments,
  );

  await db.transaction('rw', db.ideas, db.outbox, async () => {
    await db.ideas.add(row);
    await db.outbox.add(buildEntry('create', 'idea', localId, body, null, at));
    for (const entry of mediaEntries) {
      await db.outbox.add(entry);
    }
  });

  return row;
}

export async function updateIdea(
  localId: string,
  patch: UpdateIdeaInput,
): Promise<LocalIdea> {
  const { mainImage, attachments, ...fields } = patch;
  const mediaEntries = await buildMediaEntries(
    localId,
    'idea',
    mainImage,
    attachments,
  );

  return db.transaction('rw', db.ideas, db.outbox, async () => {
    const row = await db.ideas.get(localId);
    if (!row) throw new Error(`Idea not found in local store: ${localId}`);

    const at = nowIso();
    const next: LocalIdea = {
      ...row,
      title: fields.title !== undefined ? fields.title : row.title,
      stage: fields.stage !== undefined ? fields.stage : row.stage,
      syncStatus: 'pending',
      updatedAt: at,
      snapshot: {
        ...row.snapshot,
        ...stripUndefined(fields as Record<string, unknown>),
        updatedAt: at,
        pendingSync: true,
      },
    };
    await db.ideas.put(next);

    await coalesceOrEnqueueUpdate(
      'idea',
      localId,
      fields as Record<string, unknown>,
      row.version,
      at,
    );

    for (const entry of mediaEntries) {
      await db.outbox.add(entry);
    }

    return next;
  });
}

export async function publishIdea(
  localId: string,
  patch: UpdateIdeaInput,
): Promise<LocalIdea> {
  const { mainImage, attachments, ...fields } = patch;
  const mediaEntries = await buildMediaEntries(
    localId,
    'idea',
    mainImage,
    attachments,
  );

  return db.transaction('rw', db.ideas, db.outbox, async () => {
    const row = await db.ideas.get(localId);
    if (!row) throw new Error(`Idea not found in local store: ${localId}`);

    const at = nowIso();
    const next: LocalIdea = {
      ...row,
      title: fields.title !== undefined ? fields.title : row.title,
      stage: fields.stage !== undefined ? fields.stage : row.stage,
      status: 'PUBLISHED',
      syncStatus: 'pending',
      updatedAt: at,
      snapshot: {
        ...row.snapshot,
        ...stripUndefined(fields as Record<string, unknown>),
        status: 'PUBLISHED',
        updatedAt: at,
        pendingSync: true,
      },
    };
    await db.ideas.put(next);

    const queued = await db.outbox
      .where('entityLocalId')
      .equals(localId)
      .filter(e => e.status === 'queued')
      .toArray();
    const create = queued.find(e => e.op === 'create');

    if (create) {
      await db.outbox.update(create.id, {
        payload: {
          ...(create.payload as Record<string, unknown>),
          ...stripUndefined(fields as Record<string, unknown>),
          isPublished: true,
        },
      });
    } else if (!queued.some(e => e.op === 'publish')) {
      await db.outbox.add(
        buildEntry(
          'publish',
          'idea',
          localId,
          stripUndefined(fields as Record<string, unknown>),
          row.version,
          at,
        ),
      );
    }

    for (const entry of mediaEntries) {
      await db.outbox.add(entry);
    }

    return next;
  });
}

function buildMirroredIdeaRow(input: MirrorIdeaInput, at: string): LocalIdea {
  return {
    localId: input.id,
    serverId: input.id,
    syncStatus: 'synced',
    version: input.version,
    updatedAt: at,
    deleted: false,
    authorId: input.authorId,
    title: input.title,
    status: input.status,
    stage: input.stage,
    snapshot: input.snapshot,
  };
}

export async function mirrorIdeaToDexie(input: MirrorIdeaInput): Promise<void> {
  await db.transaction('rw', db.ideas, async () => {
    const existing = await db.ideas.get(input.id);
    if (existing && existing.syncStatus !== 'synced') return;
    await db.ideas.put(buildMirroredIdeaRow(input, nowIso()));
  });
}

export async function mirrorIdeasListToDexie(
  inputs: MirrorIdeaInput[],
): Promise<void> {
  await db.transaction('rw', db.ideas, async () => {
    const at = nowIso();
    for (const input of inputs) {
      const existing = await db.ideas.get(input.id);
      if (existing && existing.syncStatus !== 'synced') continue;
      await db.ideas.put(buildMirroredIdeaRow(input, at));
    }
  });
}

export async function createProblem(
  input: CreateProblemInput,
): Promise<LocalProblem> {
  const localId = uuidv7();
  const at = nowIso();
  const isPublished = input.isPublished ?? false;

  const row: LocalProblem = {
    localId,
    serverId: null,
    syncStatus: 'pending',
    version: 0,
    updatedAt: at,
    deleted: false,
    authorId: input.authorId,
    title: input.title ?? '',
    status: isPublished ? 'PUBLISHED' : 'DRAFT',
    stage: input.stage ?? null,
    snapshot: {
      id: localId,
      version: 0,
      status: isPublished ? 'PUBLISHED' : 'DRAFT',
      stage: input.stage ?? null,
      title: input.title ?? '',
      description: input.description ?? '',
      valueProposition: input.valueProposition ?? null,
      costBenefit: input.costBenefit ?? null,
      category: input.category ?? null,
      impact: input.impact ?? null,
      authorId: input.authorId,
      createdAt: at,
      updatedAt: at,
      pendingSync: true,
    },
  };

  const body: CreateProblemBody = {
    id: localId,
    isPublished,
    ...stripUndefined({
      title: input.title,
      description: input.description,
      stage: input.stage,
      valueProposition: input.valueProposition,
      costBenefit: input.costBenefit,
      category: input.category,
      impact: input.impact,
      ideaIds: input.ideaIds,
      tagIds: input.tagIds,
      tagLabels: input.tagLabels,
    }),
  };

  await db.transaction('rw', db.problems, db.outbox, async () => {
    await db.problems.add(row);
    await db.outbox.add(
      buildEntry('create', 'problem', localId, body, null, at),
    );
  });

  return row;
}

export async function updateProblem(
  localId: string,
  patch: UpdateProblemInput,
): Promise<LocalProblem> {
  const { attachments, ...fields } = patch;
  const mediaEntries = await buildMediaEntries(
    localId,
    'problem',
    null,
    attachments,
  );

  return db.transaction('rw', db.problems, db.outbox, async () => {
    const row = await db.problems.get(localId);
    if (!row) throw new Error(`Problem not found in local store: ${localId}`);

    const at = nowIso();
    const next: LocalProblem = {
      ...row,
      title: fields.title !== undefined ? fields.title : row.title,
      stage: fields.stage !== undefined ? fields.stage : row.stage,
      syncStatus: 'pending',
      updatedAt: at,
      snapshot: {
        ...row.snapshot,
        ...stripUndefined(fields as Record<string, unknown>),
        updatedAt: at,
        pendingSync: true,
      },
    };
    await db.problems.put(next);

    await coalesceOrEnqueueUpdate(
      'problem',
      localId,
      fields as Record<string, unknown>,
      row.version,
      at,
    );

    for (const entry of mediaEntries) {
      await db.outbox.add(entry);
    }

    return next;
  });
}

function buildMirroredProblemRow(
  input: MirrorProblemInput,
  at: string,
): LocalProblem {
  return {
    localId: input.id,
    serverId: input.id,
    syncStatus: 'synced',
    version: input.version,
    updatedAt: at,
    deleted: false,
    authorId: input.authorId,
    title: input.title,
    status: input.status,
    stage: input.stage,
    snapshot: input.snapshot,
  };
}

export async function mirrorProblemToDexie(
  input: MirrorProblemInput,
): Promise<void> {
  await db.transaction('rw', db.problems, async () => {
    const existing = await db.problems.get(input.id);
    if (existing && existing.syncStatus !== 'synced') return;
    await db.problems.put(buildMirroredProblemRow(input, nowIso()));
  });
}

export async function mirrorProblemsListToDexie(
  inputs: MirrorProblemInput[],
): Promise<void> {
  await db.transaction('rw', db.problems, async () => {
    const at = nowIso();
    for (const input of inputs) {
      const existing = await db.problems.get(input.id);
      if (existing && existing.syncStatus !== 'synced') continue;
      await db.problems.put(buildMirroredProblemRow(input, at));
    }
  });
}

export type SyncEntity = 'idea' | 'problem';
export type ConflictResolution = 'discard' | 'force';

function tableFor(entity: SyncEntity): typeof db.ideas {
  return (entity === 'idea'
    ? db.ideas
    : db.problems) as unknown as typeof db.ideas;
}

async function deadEntries(localId: string): Promise<OutboxEntry[]> {
  return db.outbox
    .where('entityLocalId')
    .equals(localId)
    .filter(e => e.status === 'dead')
    .toArray();
}

export async function resolveConflict(
  entity: SyncEntity,
  localId: string,
  resolution: ConflictResolution,
): Promise<void> {
  const table = tableFor(entity);
  await db.transaction('rw', table, db.outbox, async () => {
    const row = await table.get(localId);
    if (!row?.conflict) return;

    const at = nowIso();
    const { serverSnapshot, serverVersion, payload, op } = row.conflict;

    if (resolution === 'discard') {
      const changes: Partial<LocalIdea> = {
        syncStatus: 'synced',
        conflict: null,
        updatedAt: at,
        version: serverVersion ?? row.version,
      };
      if (serverSnapshot) {
        changes.snapshot = serverSnapshot;
        if (typeof serverSnapshot.status === 'string') {
          changes.status = serverSnapshot.status;
        }
        changes.stage = (serverSnapshot.stage as string | null) ?? null;
        if ('title' in serverSnapshot) {
          changes.title = (serverSnapshot.title as string | null) ?? null;
        }
      }
      await table.update(localId, changes);
      return;
    }

    await db.outbox.add(
      buildEntry(
        op === 'publish' ? 'publish' : 'update',
        entity,
        localId,
        payload,
        serverVersion,
        at,
      ),
    );
    await table.update(localId, {
      syncStatus: 'pending',
      conflict: null,
      version: serverVersion ?? row.version,
      updatedAt: at,
    });
  });
}

export async function retrySync(
  entity: SyncEntity,
  localId: string,
): Promise<void> {
  const table = tableFor(entity);
  await db.transaction('rw', table, db.outbox, async () => {
    const at = nowIso();
    for (const entry of await deadEntries(localId)) {
      await db.outbox.update(entry.id, {
        status: 'queued',
        attempts: 0,
        nextAttemptAt: at,
        lastError: null,
      });
    }
    await table.update(localId, { syncStatus: 'pending', updatedAt: at });
  });
}

export async function discardFailed(
  entity: SyncEntity,
  localId: string,
): Promise<void> {
  const table = tableFor(entity);
  await db.transaction('rw', table, db.outbox, async () => {
    const at = nowIso();
    for (const entry of await deadEntries(localId)) {
      await db.outbox.delete(entry.id);
    }
    await table.update(localId, {
      syncStatus: 'synced',
      conflict: null,
      updatedAt: at,
    });
  });
}
