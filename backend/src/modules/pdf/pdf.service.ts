import { InjectQueue } from '@nestjs/bullmq';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import {
  IdeaStatus,
  MediaKind,
  ProblemStatus,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  PDF_EXPORT_JOB_OPTIONS,
  PDF_EXPORT_QUEUE,
} from './constants/pdf-queue.constants';
import type {
  PdfExportJobData,
  PdfGeneratePayload,
  PdfServiceResponse,
} from './types/pdf.types';

const PDF_COMMENT_LIMIT = 50;

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(PDF_EXPORT_QUEUE)
    private readonly pdfQueue: Queue<PdfExportJobData>,
  ) {}

  async enqueueIdeaExport(ideaId: string, userId: string): Promise<void> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      select: { authorId: true, status: true, title: true },
    });

    if (
      !idea ||
      (idea.authorId !== userId && idea.status !== IdeaStatus.PUBLISHED)
    ) {
      throw new NotFoundException('Idea not found');
    }

    if (idea.status === IdeaStatus.DRAFT && idea.authorId !== userId) {
      throw new ForbiddenException('PDF export not available for this idea');
    }

    await this.pdfQueue.add(
      'idea',
      { entityType: 'idea', entityId: ideaId, userId },
      PDF_EXPORT_JOB_OPTIONS,
    );
  }

  async enqueueProblemExport(problemId: string, userId: string): Promise<void> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { authorId: true, status: true, title: true },
    });

    if (
      !problem ||
      (problem.authorId !== userId &&
        problem.status !== ProblemStatus.PUBLISHED)
    ) {
      throw new NotFoundException('Problem not found');
    }

    if (problem.status === ProblemStatus.DRAFT && problem.authorId !== userId) {
      throw new ForbiddenException('PDF export not available for this problem');
    }

    await this.pdfQueue.add(
      'problem',
      { entityType: 'problem', entityId: problemId, userId },
      PDF_EXPORT_JOB_OPTIONS,
    );
  }

  async buildIdeaPayload(ideaId: string): Promise<PdfGeneratePayload> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        author: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        tags: {
          include: { tag: { select: { name: true } } },
        },
        problems: {
          include: { problem: { select: { id: true, title: true } } },
        },
        media: {
          where: { kind: MediaKind.MAIN_IMAGE },
          select: { url: true },
          take: 1,
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: PDF_COMMENT_LIMIT,
          include: {
            author: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    const seenContributorIds = new Set<string>();
    const contributors: { name: string; avatar_url: string | null }[] = [];
    for (const c of idea.comments) {
      const commentAuthorId = c.authorId;
      if (commentAuthorId === idea.authorId) continue;
      if (seenContributorIds.has(commentAuthorId)) continue;
      seenContributorIds.add(commentAuthorId);
      contributors.push({
        name: `${c.author.firstName} ${c.author.lastName}`.trim(),
        avatar_url: c.author.avatarUrl,
      });
    }

    return {
      entity_type: 'idea',
      entity_id: idea.id,
      title: idea.title ?? '',
      description: idea.description ?? '',
      ai_summary: idea.aiSummary,
      author: {
        name: `${idea.author.firstName} ${idea.author.lastName}`.trim(),
        avatar_url: idea.author.avatarUrl,
      },
      contributors,
      status: idea.status,
      stage: idea.stage,
      tags: idea.tags.map(t => t.tag.name),
      like_count: idea.likeCount,
      view_count: idea.viewCount,
      comment_count: idea.commentCount,
      published_at: idea.publishedAt?.toISOString() ?? null,
      linked_entities: idea.problems.map(p => ({
        id: p.problem.id,
        title: p.problem.title,
        type: 'problem' as const,
      })),
      comments: idea.comments.map(c => ({
        author: `${c.author.firstName} ${c.author.lastName}`.trim(),
        body: c.content,
        created_at: c.createdAt.toISOString(),
      })),
      cover_image_url: idea.media[0]?.url ?? null,
    };
  }

  async buildProblemPayload(problemId: string): Promise<PdfGeneratePayload> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        author: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        tags: {
          include: { tag: { select: { name: true } } },
        },
        ideas: {
          include: { idea: { select: { id: true, title: true } } },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: PDF_COMMENT_LIMIT,
          include: {
            author: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const seenContributorIds = new Set<string>();
    const contributors: { name: string; avatar_url: string | null }[] = [];
    for (const c of problem.comments) {
      const commentAuthorId = c.authorId;
      if (commentAuthorId === problem.authorId) continue;
      if (seenContributorIds.has(commentAuthorId)) continue;
      seenContributorIds.add(commentAuthorId);
      contributors.push({
        name: `${c.author.firstName} ${c.author.lastName}`.trim(),
        avatar_url: c.author.avatarUrl,
      });
    }

    return {
      entity_type: 'problem',
      entity_id: problem.id,
      title: problem.title,
      description: problem.description,
      ai_summary: problem.aiSummary,
      author: {
        name: `${problem.author.firstName} ${problem.author.lastName}`.trim(),
        avatar_url: problem.author.avatarUrl,
      },
      contributors,
      status: problem.status,
      stage: problem.stage,
      tags: problem.tags.map(t => t.tag.name),
      like_count: problem.likeCount,
      view_count: problem.viewCount,
      comment_count: problem.commentCount,
      published_at: problem.publishedAt?.toISOString() ?? null,
      linked_entities: problem.ideas.map(i => ({
        id: i.idea.id,
        title: i.idea.title ?? '',
        type: 'idea' as const,
      })),
      comments: problem.comments.map(c => ({
        author: `${c.author.firstName} ${c.author.lastName}`.trim(),
        body: c.content,
        created_at: c.createdAt.toISOString(),
      })),
      cover_image_url: null,
    };
  }

  async callPdfService(
    payload: PdfGeneratePayload,
  ): Promise<PdfServiceResponse> {
    const pdfServiceUrl = this.config.getOrThrow<string>('PDF_SERVICE_URL');
    const pdfInternalSecret = this.config.getOrThrow<string>(
      'PDF_INTERNAL_SECRET',
    );

    let response: Response;
    try {
      response = await fetch(`${pdfServiceUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pdfInternalSecret}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      this.logger.error('PDF service unreachable', error);
      throw new InternalServerErrorException('PDF service unreachable');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`PDF service returned ${response.status}: ${body}`);
      throw new InternalServerErrorException('PDF generation failed');
    }

    return response.json() as Promise<PdfServiceResponse>;
  }
}
