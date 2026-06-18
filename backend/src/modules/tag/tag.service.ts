import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import type { TagListItem } from './types/tag.types';

const TAG_LIST_SELECT = {
  id: true,
  name: true,
  label: true,
} as const;

@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(options?: { limit?: number }): Promise<TagListItem[]> {
    return this.prisma.tag.findMany({
      select: TAG_LIST_SELECT,
      orderBy: { name: 'asc' },
      ...(options?.limit !== undefined ? { take: options.limit } : {}),
    });
  }
}
