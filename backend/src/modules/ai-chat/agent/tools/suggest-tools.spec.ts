import type { PrismaService } from '../../../../core/prisma/prisma.service';
import { createProposeDraftTool } from './propose-draft.tool';
import { createSuggestLinkedProblemsTool } from './suggest-linked-problems.tool';
import { createSuggestTagsTool } from './suggest-tags.tool';
import { createTestContext } from './test-context';

const ideaForm = {
  type: 'idea_form' as const,
  title: 'Smart parking',
  tags: ['iot'],
  linkedProblemIds: ['p-linked'],
};

describe('propose_draft', () => {
  it('emits a normalized idea draft proposal and writes nothing', async () => {
    const { config, events } = createTestContext();

    const result = JSON.parse(
      await createProposeDraftTool().invoke(
        {
          draftType: 'idea',
          title: '  Smart Parking  ',
          description: ' Sensors in lots. ',
          tags: ['IoT', 'iot', '#mobility', 'a', 'b', 'c', 'd'],
        },
        config,
      ),
    );

    expect(result.ok).toBe(true);
    expect(events).toEqual([
      {
        type: 'draft_proposal',
        draftType: 'idea',
        title: 'Smart Parking',
        description: 'Sensors in lots.',
        tags: ['IoT', 'mobility', 'a', 'b', 'c'],
      },
    ]);
  });

  it('drops tags for problem drafts', async () => {
    const { config, events } = createTestContext();

    await createProposeDraftTool().invoke(
      {
        draftType: 'problem',
        title: 'Slow onboarding',
        description: 'Hard start.',
        tags: ['x'],
      },
      config,
    );

    expect(events[0]).toMatchObject({ draftType: 'problem', tags: [] });
  });
});

describe('suggest_tags', () => {
  it('refuses outside the idea form and emits nothing', async () => {
    const prisma = { tag: { findMany: jest.fn() } };
    const { config, events } = createTestContext({ pageContext: null });

    const result = JSON.parse(
      await createSuggestTagsTool(prisma as unknown as PrismaService).invoke(
        { tags: ['a'] },
        config,
      ),
    );

    expect(result.error).toBe(
      'suggest_tags is only available while editing an idea',
    );
    expect(events).toEqual([]);
  });

  it('removes tags already on the form, maps to existing tag names, caps at 5', async () => {
    const prisma = {
      tag: { findMany: jest.fn().mockResolvedValue([{ name: 'Mobility' }]) },
    };
    const { config, events } = createTestContext({ pageContext: ideaForm });

    await createSuggestTagsTool(prisma as unknown as PrismaService).invoke(
      { tags: ['IOT', 'mobility', 'a', 'b', 'c', 'd', 'e'] },
      config,
    );

    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          in: ['mobility', 'a', 'b', 'c', 'd', 'e'],
          mode: 'insensitive',
        },
      },
      select: { name: true },
    });
    expect(events).toEqual([
      {
        type: 'field_action',
        field: 'tags',
        values: ['Mobility', 'a', 'b', 'c', 'd'],
      },
    ]);
  });

  it('emits nothing when every tag is already on the form', async () => {
    const prisma = { tag: { findMany: jest.fn().mockResolvedValue([]) } };
    const { config, events } = createTestContext({ pageContext: ideaForm });

    await createSuggestTagsTool(prisma as unknown as PrismaService).invoke(
      { tags: ['IoT'] },
      config,
    );

    expect(events).toEqual([]);
  });
});

describe('suggest_linked_problems', () => {
  it('keeps only existing visible problems not yet linked, preserving order', async () => {
    const prisma = {
      problem: {
        findMany: jest.fn().mockResolvedValue([{ id: 'p2' }, { id: 'p1' }]),
      },
    };
    const { config, events } = createTestContext({
      pageContext: ideaForm,
      userId: 'u-1',
      role: 'ADMIN',
    });

    const result = JSON.parse(
      await createSuggestLinkedProblemsTool(
        prisma as unknown as PrismaService,
      ).invoke(
        { problemIds: ['p1', 'invented', 'p-linked', 'p2', 'p1'] },
        config,
      ),
    );

    expect(prisma.problem.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['p1', 'invented', 'p2'] },
        OR: [{ status: 'PUBLISHED' }, { authorId: 'u-1' }],
      },
      select: { id: true },
    });
    expect(result.kept).toEqual(['p1', 'p2']);
    expect(result.dropped).toEqual(['invented', 'p-linked']);
    expect(events).toEqual([
      { type: 'field_action', field: 'linked_problems', values: ['p1', 'p2'] },
    ]);
  });

  it('emits nothing when no ID survives', async () => {
    const prisma = { problem: { findMany: jest.fn().mockResolvedValue([]) } };
    const { config, events } = createTestContext({ pageContext: ideaForm });

    const result = JSON.parse(
      await createSuggestLinkedProblemsTool(
        prisma as unknown as PrismaService,
      ).invoke({ problemIds: ['someone-elses-draft'] }, config),
    );

    expect(events).toEqual([]);
    expect(result.note).toContain('search_ideas_problems');
  });
});
