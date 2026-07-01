import { Test } from '@nestjs/testing';

import { EntityChunkSyncService } from './entity-chunk-sync.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockExecuteRaw = jest.fn().mockResolvedValue(undefined);
const mockTransaction = jest
  .fn()
  .mockImplementation((calls: Promise<unknown>[]) => Promise.all(calls));
const mockIdeaFindUnique = jest.fn();
const mockProblemFindUnique = jest.fn();

const mockPrisma = {
  $executeRaw: mockExecuteRaw,
  $transaction: mockTransaction,
  idea: { findUnique: mockIdeaFindUnique },
  problem: { findUnique: mockProblemFindUnique },
};

const publishedIdea = {
  id: 'idea-1',
  title: 'Smart Parking',
  description: 'Sensors for parking lots',
  stage: 'IDEATION',
  status: 'PUBLISHED',
  author: { firstName: 'Alice', lastName: 'Smith' },
  tags: [{ tag: { name: 'proptech' } }, { tag: { name: 'iot' } }],
};

const publishedProblem = {
  id: 'prob-1',
  title: 'Traffic Congestion',
  description: 'Too many cars',
  valueProposition: 'Reduce travel time',
  category: 'Urban',
  impact: 'High',
  stage: 'IDEATION',
  status: 'PUBLISHED',
  author: { firstName: 'Bob', lastName: 'Jones' },
  tags: [{ tag: { name: 'mobility' } }],
};

describe('EntityChunkSyncService', () => {
  let service: EntityChunkSyncService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EntityChunkSyncService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(EntityChunkSyncService);
  });

  it('upserts a knowledge_chunk for a published idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(publishedIdea);

    await service.syncEntity('idea', 'idea-1');

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(2); // DELETE + INSERT inside transaction
  });

  it('skips a non-published idea', async () => {
    mockIdeaFindUnique.mockResolvedValue({ ...publishedIdea, status: 'DRAFT' });

    await service.syncEntity('idea', 'idea-1');

    expect(mockExecuteRaw).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('deletes chunk when idea is not found (deleted)', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    await service.syncEntity('idea', 'idea-1');

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1); // only DELETE, no transaction
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('upserts a knowledge_chunk for a published problem', async () => {
    mockProblemFindUnique.mockResolvedValue(publishedProblem);

    await service.syncEntity('problem', 'prob-1');

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(2); // DELETE + INSERT inside transaction
  });

  it('skips a non-published problem', async () => {
    mockProblemFindUnique.mockResolvedValue({ ...publishedProblem, status: 'ARCHIVED' });

    await service.syncEntity('problem', 'prob-1');

    expect(mockExecuteRaw).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('deletes chunk when problem is not found (deleted)', async () => {
    mockProblemFindUnique.mockResolvedValue(null);

    await service.syncEntity('problem', 'prob-1');

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1); // only DELETE, no transaction
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
