import { Test } from '@nestjs/testing';

import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { EntityChunkSyncService } from './entity-chunk-sync.service';

const mockExecuteRaw = jest.fn().mockResolvedValue(undefined);
const mockIdeaFindUnique = jest.fn();
const mockProblemFindUnique = jest.fn();
const mockEmbedText = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);

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
  authorId: 'author-a',
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
  authorId: 'author-b',
  author: { firstName: 'Bob', lastName: 'Jones' },
  tags: [{ tag: { name: 'mobility' } }],
};

const draftIdea = { ...publishedIdea, id: 'idea-2', status: 'DRAFT' };

describe('EntityChunkSyncService', () => {
  let service: EntityChunkSyncService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EntityChunkSyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: { embedText: mockEmbedText } },
      ],
    }).compile();
    service = module.get(EntityChunkSyncService);
  });

  it('upserts a knowledge_chunk with embedding for a published idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(publishedIdea);

    await service.syncEntity('idea', 'idea-1');

    expect(mockEmbedText).toHaveBeenCalledTimes(1);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(2); // DELETE + INSERT
  });

  it('deletes chunk when idea transitions to non-published', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      ...publishedIdea,
      status: 'ARCHIVED',
    });

    await service.syncEntity('idea', 'idea-1');

    expect(mockEmbedText).not.toHaveBeenCalled();
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1); // DELETE only
  });

  it('deletes chunk when idea is not found', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    await service.syncEntity('idea', 'idea-1');

    expect(mockEmbedText).not.toHaveBeenCalled();
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
  });

  it('upserts a knowledge_chunk with embedding for a published problem', async () => {
    mockProblemFindUnique.mockResolvedValue(publishedProblem);

    await service.syncEntity('problem', 'prob-1');

    expect(mockEmbedText).toHaveBeenCalledTimes(1);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);
  });

  it('deletes chunk when problem transitions to non-published', async () => {
    mockProblemFindUnique.mockResolvedValue({
      ...publishedProblem,
      status: 'ARCHIVED',
    });

    await service.syncEntity('problem', 'prob-1');

    expect(mockEmbedText).not.toHaveBeenCalled();
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1); // DELETE only
  });

  it('deletes chunk when problem is not found (deleted)', async () => {
    mockProblemFindUnique.mockResolvedValue(null);

    await service.syncEntity('problem', 'prob-1');

    expect(mockEmbedText).not.toHaveBeenCalled();
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
  });

  it('still deletes chunk when embedding fails', async () => {
    mockIdeaFindUnique.mockResolvedValue(publishedIdea);
    mockEmbedText.mockRejectedValueOnce(new Error('Gemini down'));

    await service.syncEntity('idea', 'idea-1');

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1); // DELETE runs, INSERT is skipped
  });

  function insertedMetadata(): Record<string, unknown> {
    const insertCall = mockExecuteRaw.mock.calls.find(call =>
      (call[0] as TemplateStringsArray)
        .join('')
        .includes('INSERT INTO knowledge_chunk'),
    );
    const metadataJson = insertCall!
      .slice(1)
      .find(
        value => typeof value === 'string' && value.startsWith('{"type"'),
      ) as string;
    return JSON.parse(metadataJson) as Record<string, unknown>;
  }

  it('stores authorId, title and status in idea chunk metadata without access', async () => {
    mockIdeaFindUnique.mockResolvedValue(publishedIdea);

    await service.syncEntity('idea', 'idea-1');

    const metadata = insertedMetadata();
    expect(metadata).toMatchObject({
      type: 'idea',
      id: 'idea-1',
      title: 'Smart Parking',
      status: 'PUBLISHED',
      authorId: 'author-a',
    });
    expect(metadata).not.toHaveProperty('access');
  });

  it('stores authorId for draft ideas so the author can still find them', async () => {
    mockIdeaFindUnique.mockResolvedValue(draftIdea);

    await service.syncEntity('idea', 'idea-2');

    expect(insertedMetadata()).toMatchObject({
      status: 'DRAFT',
      authorId: 'author-a',
    });
  });

  it('stores authorId and title in problem chunk metadata', async () => {
    mockProblemFindUnique.mockResolvedValue(publishedProblem);

    await service.syncEntity('problem', 'prob-1');

    expect(insertedMetadata()).toMatchObject({
      type: 'problem',
      title: 'Traffic Congestion',
      authorId: 'author-b',
    });
  });
});
