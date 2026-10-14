import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

import type { EntityChunkSyncService } from './entity-chunk-sync.service';
import type { IIngestionService } from './ingestion.interface';
import { RagController } from './rag.controller';

function setup() {
  const reconcileAll = jest.fn().mockResolvedValue({ synced: 7, removed: 2 });
  const controller = new RagController(
    {} as IIngestionService,
    { reconcileAll } as unknown as EntityChunkSyncService,
  );
  return { controller, reconcileAll };
}

const requestFor = (role: 'ADMIN' | 'MEMBER') =>
  ({ user: { id: 'u1', role } }) as unknown as Request & {
    user: { id: string; role: 'ADMIN' | 'MEMBER' };
  };

describe('RagController.reindexEntities', () => {
  it('reconciles all entity chunks for an admin and returns the counts', async () => {
    const { controller, reconcileAll } = setup();

    await expect(
      controller.reindexEntities(requestFor('ADMIN')),
    ).resolves.toEqual({ synced: 7, removed: 2 });
    expect(reconcileAll).toHaveBeenCalledTimes(1);
  });

  it('rejects a non-admin without reconciling', async () => {
    const { controller, reconcileAll } = setup();

    await expect(
      controller.reindexEntities(requestFor('MEMBER')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(reconcileAll).not.toHaveBeenCalled();
  });
});
