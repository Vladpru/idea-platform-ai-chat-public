import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

const STALE_DRAFT_DAYS = 30;
const STAGE_STAGNATION_DAYS = 60;
const MAX_NUDGE_ITEMS = 3;

export interface NudgeItem {
  type: 'idea' | 'problem';
  id: string;
  title: string;
  reason: 'stale_draft' | 'stage_stagnation';
  daysSinceUpdate: number;
  stage?: string;
}

@Injectable()
export class NudgeService {
  constructor(private readonly prisma: PrismaService) {}

  async getNudgeItems(userId: string): Promise<NudgeItem[]> {
    const now = new Date();
    const staleDraftCutoff = new Date(now.getTime() - STALE_DRAFT_DAYS * 24 * 60 * 60 * 1000);
    const stagnationCutoff = new Date(now.getTime() - STAGE_STAGNATION_DAYS * 24 * 60 * 60 * 1000);

    const [ideas, problems] = await Promise.all([
      this.prisma.idea.findMany({
        where: {
          authorId: userId,
          OR: [
            { status: 'DRAFT', updatedAt: { lt: staleDraftCutoff } },
            { status: 'PUBLISHED', updatedAt: { lt: stagnationCutoff } },
          ],
        },
        select: { id: true, title: true, stage: true, status: true, updatedAt: true },
      }),
      this.prisma.problem.findMany({
        where: {
          authorId: userId,
          OR: [
            { status: 'DRAFT', updatedAt: { lt: staleDraftCutoff } },
            { status: 'PUBLISHED', updatedAt: { lt: stagnationCutoff } },
          ],
        },
        select: { id: true, title: true, stage: true, status: true, updatedAt: true },
      }),
    ]);

    const toItem = (
      row: { id: string; title: string | null; stage: string | null; status: string; updatedAt: Date },
      type: 'idea' | 'problem',
    ): NudgeItem => {
      const daysSinceUpdate = Math.floor((now.getTime() - row.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      const reason: NudgeItem['reason'] = row.status === 'DRAFT' ? 'stale_draft' : 'stage_stagnation';
      return {
        type,
        id: row.id,
        title: row.title ?? 'Untitled',
        reason,
        daysSinceUpdate,
        ...(row.stage ? { stage: row.stage } : {}),
      };
    };

    const all: NudgeItem[] = [
      ...ideas.map(r => toItem(r, 'idea')),
      ...problems.map(r => toItem(r, 'problem')),
    ];

    return all
      .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)
      .slice(0, MAX_NUDGE_ITEMS);
  }
}
