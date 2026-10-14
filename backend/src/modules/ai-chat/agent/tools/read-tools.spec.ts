import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import type { ChunkResult } from '../../../rag/knowledge-retrieval.service';
import { createGetEntityTool } from './get-entity.tool';
import { createGetMyItemsTool } from './get-my-items.tool';
import { createSearchIdeasProblemsTool } from './search-ideas-problems.tool';
import {
  chunkToSource,
  createSearchKnowledgeTool,
} from './search-knowledge.tool';
import { createTestContext } from './test-context';

const chunk = (
  source: string,
  relevance: number,
  title?: string,
): ChunkResult => ({
  source,
  content: `chunk text ${relevance}`,
  relevance,
  metadata: title ? { title } : {},
});

describe('search_knowledge', () => {
  it('passes user identity and role to retrieval and records sources', async () => {
    const retrieve = jest
      .fn()
      .mockResolvedValue([
        chunk('idea:i1', 0.9, 'Smart Parking'),
        chunk('guide/faq.md', 0.5),
      ]);
    const tool = createSearchKnowledgeTool({ retrieve });
    const { config, context } = createTestContext({
      userId: 'u-9',
      role: 'ADMIN',
    });

    const result = JSON.parse(await tool.invoke({ query: 'parking' }, config));

    expect(retrieve).toHaveBeenCalledWith('parking', {
      userId: 'u-9',
      role: 'ADMIN',
      topK: 5,
    });
    expect(result.results).toHaveLength(2);
    expect(JSON.stringify(result)).not.toContain('faq.md');
    expect(context.sources.list()).toEqual([
      { type: 'idea', id: 'i1', title: 'Smart Parking', relevance: 0.9 },
      { type: 'knowledge', title: 'guide/faq.md', relevance: 0.5 },
    ]);
  });

  it('returns an error object when retrieval throws', async () => {
    const retrieve = jest.fn().mockRejectedValue(new Error('db down'));
    const tool = createSearchKnowledgeTool({ retrieve });
    const { config } = createTestContext();

    expect(JSON.parse(await tool.invoke({ query: 'x' }, config))).toEqual({
      error: 'search_knowledge failed',
    });
  });

  it('maps problem chunks without a title to their source string', () => {
    expect(chunkToSource(chunk('problem:p1', 0.4))).toEqual({
      type: 'problem',
      id: 'p1',
      title: 'problem:p1',
      relevance: 0.4,
    });
  });
});

describe('search_ideas_problems', () => {
  function setup(chunks: ChunkResult[]) {
    const retrieve = jest.fn().mockResolvedValue(chunks);
    const prisma = {
      idea: { findMany: jest.fn().mockResolvedValue([]) },
      problem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const tool = createSearchIdeasProblemsTool(
      prisma as unknown as PrismaService,
      { retrieve },
    );
    return { tool, retrieve, prisma };
  }

  it('hydrates hits from the database with the visibility condition, in ranking order', async () => {
    const { tool, retrieve, prisma } = setup([
      chunk('problem:p1', 0.8),
      chunk('idea:i1', 0.6),
    ]);
    prisma.idea.findMany.mockResolvedValue([
      {
        id: 'i1',
        title: 'Idea One',
        description: 'd'.repeat(400),
        status: 'PUBLISHED',
        stage: 'IDEATION',
        tags: [{ tag: { name: 'iot' } }],
      },
    ]);
    prisma.problem.findMany.mockResolvedValue([
      {
        id: 'p1',
        title: 'Problem One',
        description: 'short',
        status: 'DRAFT',
        stage: null,
        tags: [],
      },
    ]);
    const { config, context } = createTestContext({ userId: 'u-1' });

    const result = JSON.parse(
      await tool.invoke({ query: 'iot', type: 'any', limit: 5 }, config),
    );

    expect(retrieve).toHaveBeenCalledWith('iot', {
      userId: 'u-1',
      role: 'MEMBER',
      topK: 10,
      scope: 'entities',
    });
    expect(prisma.idea.findMany.mock.calls[0][0].where).toEqual({
      id: { in: ['i1'] },
      OR: [{ status: 'PUBLISHED' }, { authorId: 'u-1' }],
    });
    expect(prisma.problem.findMany.mock.calls[0][0].where).toEqual({
      id: { in: ['p1'] },
      OR: [{ status: 'PUBLISHED' }, { authorId: 'u-1' }],
    });
    expect(result.results.map((r: { id: string }) => r.id)).toEqual([
      'p1',
      'i1',
    ]);
    expect(result.results[1].description.length).toBe(300);
    expect(result.results[1].tags).toEqual(['iot']);
    expect(context.sources.list().map(s => s.id)).toEqual(['p1', 'i1']);
  });

  it('drops hits the database does not return (not visible)', async () => {
    const { tool, prisma } = setup([chunk('idea:someone-elses-draft', 0.9)]);
    prisma.idea.findMany.mockResolvedValue([]);
    const { config } = createTestContext();

    const result = JSON.parse(await tool.invoke({ query: 'x' }, config));

    expect(result.results).toEqual([]);
    expect(result.note).toBe('No matching ideas or problems found');
  });

  it('filters by type before querying', async () => {
    const { tool, prisma } = setup([
      chunk('idea:i1', 0.9),
      chunk('problem:p1', 0.8),
    ]);
    const { config } = createTestContext();

    await tool.invoke({ query: 'x', type: 'problem' }, config);

    expect(prisma.idea.findMany).not.toHaveBeenCalled();
    expect(prisma.problem.findMany).toHaveBeenCalled();
  });
});

describe('get_my_items', () => {
  it("returns only the current user's items, newest first, max 20", async () => {
    const day = (n: number) => new Date(Date.UTC(2026, 0, n));
    const prisma = {
      idea: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'i1',
            title: null,
            status: 'DRAFT',
            stage: null,
            updatedAt: day(2),
          },
        ]),
      },
      problem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'p1',
            title: 'P',
            status: 'PUBLISHED',
            stage: 'IDEATION',
            updatedAt: day(3),
          },
        ]),
      },
    };
    const tool = createGetMyItemsTool(prisma as unknown as PrismaService);
    const { config } = createTestContext({ userId: 'u-5' });

    const result = JSON.parse(await tool.invoke({}, config));

    expect(prisma.idea.findMany.mock.calls[0][0]).toMatchObject({
      where: { authorId: 'u-5', status: { in: ['DRAFT', 'PUBLISHED'] } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    expect(result.items.map((i: { id: string }) => i.id)).toEqual(['p1', 'i1']);
    expect(result.items[1].title).toBe('Untitled');
  });

  it('applies the status filter and skips the other type', async () => {
    const prisma = {
      idea: { findMany: jest.fn().mockResolvedValue([]) },
      problem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const tool = createGetMyItemsTool(prisma as unknown as PrismaService);
    const { config } = createTestContext({ userId: 'u-5' });

    await tool.invoke({ type: 'idea', status: 'DRAFT' }, config);

    expect(prisma.idea.findMany.mock.calls[0][0].where).toEqual({
      authorId: 'u-5',
      status: 'DRAFT',
    });
    expect(prisma.problem.findMany).not.toHaveBeenCalled();
  });
});

describe('get_entity', () => {
  function setup() {
    const visibility = {
      getVisibleIdea: jest.fn().mockResolvedValue({}),
      getVisibleProblem: jest.fn().mockResolvedValue({}),
    };
    const prisma = {
      idea: { findUnique: jest.fn() },
      problem: { findUnique: jest.fn() },
    };
    const tool = createGetEntityTool(
      prisma as unknown as PrismaService,
      visibility,
    );
    return { tool, visibility, prisma };
  }

  it("returns not found for another user's draft without loading it, for ADMIN too", async () => {
    const { tool, visibility, prisma } = setup();
    visibility.getVisibleIdea.mockRejectedValue(new NotFoundException());
    const { config, context } = createTestContext({
      role: 'ADMIN',
      userId: 'admin-1',
    });

    const result = JSON.parse(
      await tool.invoke({ type: 'idea', id: 'draft-x' }, config),
    );

    expect(visibility.getVisibleIdea).toHaveBeenCalledWith(
      'draft-x',
      'admin-1',
    );
    expect(result).toEqual({ error: 'not found' });
    expect(prisma.idea.findUnique).not.toHaveBeenCalled();
    expect(context.sources.list()).toEqual([]);
  });

  it('returns idea details and records the source', async () => {
    const { tool, prisma } = setup();
    prisma.idea.findUnique.mockResolvedValue({
      id: 'i1',
      title: 'Smart Parking',
      description: 'x'.repeat(2500),
      status: 'PUBLISHED',
      stage: 'IDEATION',
      author: { firstName: 'Ann', lastName: null },
      tags: [{ tag: { name: 'iot' } }],
      _count: { problems: 2 },
    });
    const { config, context } = createTestContext();

    const result = JSON.parse(
      await tool.invoke({ type: 'idea', id: 'i1' }, config),
    );

    expect(result).toMatchObject({
      type: 'idea',
      id: 'i1',
      title: 'Smart Parking',
      author: 'Ann',
      tags: ['iot'],
      linkedProblemsCount: 2,
    });
    expect(result.description.length).toBe(2000);
    expect(context.sources.list()).toEqual([
      { type: 'idea', id: 'i1', title: 'Smart Parking', relevance: 1 },
    ]);
  });

  it('returns problem details', async () => {
    const { tool, prisma } = setup();
    prisma.problem.findUnique.mockResolvedValue({
      id: 'p1',
      title: 'Traffic',
      description: 'Too many cars',
      status: 'PUBLISHED',
      stage: null,
      valueProposition: 'Less time',
      category: 'Urban',
      impact: 'High',
      author: { firstName: null, lastName: null },
      tags: [],
      _count: { ideas: 1 },
    });
    const { config } = createTestContext();

    const result = JSON.parse(
      await tool.invoke({ type: 'problem', id: 'p1' }, config),
    );

    expect(result).toMatchObject({
      type: 'problem',
      author: null,
      valueProposition: 'Less time',
      linkedIdeasCount: 1,
    });
  });
});
