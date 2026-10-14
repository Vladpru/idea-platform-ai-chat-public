import { Test } from '@nestjs/testing';
import { NudgeService } from './nudge.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const NOW = new Date('2026-07-06T00:00:00Z');

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

describe('NudgeService', () => {
  let service: NudgeService;
  let prisma: { idea: { findMany: jest.Mock }; problem: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      idea: { findMany: jest.fn() },
      problem: { findMany: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        NudgeService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(NudgeService);
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => jest.useRealTimers());

  it('returns stale draft idea', async () => {
    prisma.idea.findMany.mockResolvedValue([
      { id: 'i1', title: 'Smart Parking', stage: null, status: 'DRAFT', updatedAt: daysAgo(45) },
    ]);
    prisma.problem.findMany.mockResolvedValue([]);

    const items = await service.getNudgeItems('user-1');

    expect(items).toEqual([
      { type: 'idea', id: 'i1', title: 'Smart Parking', reason: 'stale_draft', daysSinceUpdate: 45 },
    ]);
  });

  it('returns stage-stagnant published idea', async () => {
    prisma.idea.findMany.mockResolvedValue([
      { id: 'i2', title: 'Urban Mobility', stage: 'prototyping', status: 'PUBLISHED', updatedAt: daysAgo(65) },
    ]);
    prisma.problem.findMany.mockResolvedValue([]);

    const items = await service.getNudgeItems('user-1');

    expect(items).toEqual([
      { type: 'idea', id: 'i2', title: 'Urban Mobility', reason: 'stage_stagnation', daysSinceUpdate: 65, stage: 'prototyping' },
    ]);
  });

  it('caps result at 3 items sorted by daysSinceUpdate DESC', async () => {
    prisma.idea.findMany.mockResolvedValue([
      { id: 'i1', title: 'A', stage: null, status: 'DRAFT', updatedAt: daysAgo(31) },
      { id: 'i2', title: 'B', stage: null, status: 'DRAFT', updatedAt: daysAgo(50) },
      { id: 'i3', title: 'C', stage: null, status: 'DRAFT', updatedAt: daysAgo(90) },
    ]);
    prisma.problem.findMany.mockResolvedValue([
      { id: 'p1', title: 'D', stage: null, status: 'DRAFT', updatedAt: daysAgo(40) },
    ]);

    const items = await service.getNudgeItems('user-1');

    expect(items).toHaveLength(3);
    expect(items[0].daysSinceUpdate).toBe(90);
    expect(items[1].daysSinceUpdate).toBe(50);
    expect(items[2].daysSinceUpdate).toBe(40);
  });

  it('returns empty array when nothing qualifies', async () => {
    prisma.idea.findMany.mockResolvedValue([]);
    prisma.problem.findMany.mockResolvedValue([]);

    const items = await service.getNudgeItems('user-1');

    expect(items).toEqual([]);
  });
});
