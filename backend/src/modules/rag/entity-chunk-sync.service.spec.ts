import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EntityChunkSyncService } from './entity-chunk-sync.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockExecuteRaw = jest.fn().mockResolvedValue(undefined);
const mockIdeaFindUnique = jest.fn();
const mockProblemFindUnique = jest.fn();

const mockPrisma = {
  $executeRaw: mockExecuteRaw,
  idea: { findUnique: mockIdeaFindUnique },
  problem: { findUnique: mockProblemFindUnique },
};

const publishedIdea = {
  id: 'idea-1',
  title: 'Smart Parking',
  description: 'Sensors for parking lots',
  stage: 'IDEATION',
  status: 'PUBLISHED',
  author: { name: 'Alice' },
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
  author: { name: 'Bob' },
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
        { provide: EventEmitter2, useValue: { on: jest.fn() } },
      ],
    }).compile();
    service = module.get(EntityChunkSyncService);
  });

  it('upserts a knowledge_chunk for a published idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(publishedIdea);

    await service.syncEntity('idea', 'idea-1');

    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);
  });

  it('skips a non-published idea', async () => {
    mockIdeaFindUnique.mockResolvedValue({ ...publishedIdea, status: 'DRAFT' });

    await service.syncEntity('idea', 'idea-1');

    expect(mockExecuteRaw).not.toHaveBeenCalled();
  });

  it('deletes chunk when idea is not found (deleted)', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    await service.syncEntity('idea', 'idea-1');

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
  });

  it('upserts a knowledge_chunk for a published problem', async () => {
    mockProblemFindUnique.mockResolvedValue(publishedProblem);

    await service.syncEntity('problem', 'prob-1');

    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);
  });

  it('skips a non-published problem', async () => {
    mockProblemFindUnique.mockResolvedValue({
      ...publishedProblem,
      status: 'ARCHIVED',
    });

    await service.syncEntity('problem', 'prob-1');

    expect(mockExecuteRaw).not.toHaveBeenCalled();
  });
});
