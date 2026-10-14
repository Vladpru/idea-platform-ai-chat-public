import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';

function sqlFragments(call: unknown[]): Prisma.Sql[] {
  return call
    .slice(1)
    .filter((value): value is Prisma.Sql => value instanceof Prisma.Sql);
}

describe('KnowledgeRetrievalService.retrieve', () => {
  let queryRaw: jest.Mock;
  let embedText: jest.Mock;
  let service: KnowledgeRetrievalService;

  beforeEach(() => {
    queryRaw = jest.fn().mockResolvedValue([]);
    embedText = jest.fn().mockResolvedValue([0.1, 0.2]);
    service = new KnowledgeRetrievalService(
      { $queryRaw: queryRaw } as unknown as PrismaService,
      { embedText } as unknown as EmbeddingService,
    );
  });

  it('restricts entity chunks to published or own items for ADMIN', async () => {
    await service.retrieve('parking', { userId: 'user-1', role: 'ADMIN' });

    const fragments = sqlFragments(queryRaw.mock.calls[0]);
    const filter = fragments.find(f => f.sql.includes("metadata->>'authorId'"));
    expect(filter).toBeDefined();
    expect(filter!.sql).toContain("metadata->>'status' = 'PUBLISHED'");
    expect(filter!.values).toContain('user-1');
    expect(fragments.some(f => f.sql.includes("metadata->>'access'"))).toBe(
      false,
    );
  });

  it('also hides admin-only vault notes for MEMBER', async () => {
    await service.retrieve('parking', { userId: 'user-2', role: 'MEMBER' });

    const fragments = sqlFragments(queryRaw.mock.calls[0]);
    expect(fragments.some(f => f.sql.includes("metadata->>'access'"))).toBe(
      true,
    );
    expect(fragments.some(f => f.values.includes('user-2'))).toBe(true);
  });

  it('excludes vault chunks when scope is entities', async () => {
    await service.retrieve('parking', {
      userId: 'user-1',
      role: 'ADMIN',
      scope: 'entities',
    });

    const fragments = sqlFragments(queryRaw.mock.calls[0]);
    expect(fragments.some(f => f.sql.includes('ELSE FALSE'))).toBe(true);
  });

  it('applies the same filter in the keyword fallback', async () => {
    embedText.mockRejectedValueOnce(new Error('embedding down'));

    await service.retrieve('parking', { userId: 'user-3', role: 'ADMIN' });

    const fragments = sqlFragments(queryRaw.mock.calls[0]);
    expect(fragments.some(f => f.values.includes('user-3'))).toBe(true);
  });

  it('uses topK as the final limit', async () => {
    await service.retrieve('parking', {
      userId: 'user-1',
      role: 'ADMIN',
      topK: 7,
    });

    expect(queryRaw.mock.calls[0]).toContain(7);
  });
});
