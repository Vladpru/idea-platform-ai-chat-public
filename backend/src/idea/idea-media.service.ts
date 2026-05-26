import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  IdeaStatus,
  MediaKind,
  MediaProvider,
} from '../../generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { IdeaQueryService } from './idea-query.service';
import type { IdeaFormResponse } from './types/idea-form.types';

const IDEA_NOT_FOUND = 'Idea not found';

const ALLOWED_UPLOAD_STATUSES: IdeaStatus[] = [
  IdeaStatus.DRAFT,
  IdeaStatus.PUBLISHED,
];

@Injectable()
export class IdeaMediaService {
  private readonly logger = new Logger(IdeaMediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly ideaQueryService: IdeaQueryService,
  ) {}

  enqueueCloudinaryDeletes(publicIds: string[]): void {
    if (publicIds.length === 0) {
      return;
    }

    void Promise.allSettled(
      publicIds.map(publicId => this.cloudinary.deleteByPublicId(publicId)),
    ).then(results => {
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        this.logger.warn(
          `Cloudinary cleanup failed for ${failedCount}/${publicIds.length} asset(s) after idea deletion`,
        );
      }
    });
  }

  async uploadMainImage(
    id: string,
    authorId: string,
    file: Express.Multer.File,
  ): Promise<IdeaFormResponse> {
    const idea = await this.prisma.idea.findFirst({
      where: { id, authorId },
      select: { id: true, status: true },
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    if (!ALLOWED_UPLOAD_STATUSES.includes(idea.status)) {
      throw new BadRequestException(
        'Image upload is only allowed for draft or published ideas',
      );
    }

    const uploaded = await this.cloudinary.uploadIdeaMainImage(file, id);
    let publicIdsToDelete: string[] = [];

    try {
      await this.prisma.$transaction(async tx => {
        const existingMedia = await tx.ideaMedia.findMany({
          where: { ideaId: id, kind: MediaKind.MAIN_IMAGE },
          select: { publicId: true },
        });

        publicIdsToDelete = existingMedia.map(m => m.publicId);

        if (publicIdsToDelete.length > 0) {
          await tx.ideaMedia.deleteMany({
            where: { ideaId: id, kind: MediaKind.MAIN_IMAGE },
          });
        }

        await tx.ideaMedia.create({
          data: {
            ideaId: id,
            kind: MediaKind.MAIN_IMAGE,
            provider: MediaProvider.CLOUDINARY,
            url: uploaded.url,
            publicId: uploaded.publicId,
            mimeType: file.mimetype,
            byteSize: file.size,
            originalFilename: file.originalname || 'image',
            sortOrder: 0,
          },
        });
      });

      if (publicIdsToDelete.length > 0) {
        this.enqueueCloudinaryDeletes(publicIdsToDelete);
      }
    } catch (err) {
      await this.cloudinary.deleteByPublicId(uploaded.publicId).catch(() => {});
      throw err;
    }

    return this.ideaQueryService.findByIdSmart(id, authorId);
  }

  async uploadAttachment(
    id: string,
    authorId: string,
    file: Express.Multer.File,
  ): Promise<IdeaFormResponse> {
    const idea = await this.prisma.idea.findFirst({
      where: { id, authorId },
      select: { id: true, status: true },
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    if (!ALLOWED_UPLOAD_STATUSES.includes(idea.status)) {
      throw new BadRequestException(
        'Attachment upload is only allowed for draft or published ideas',
      );
    }

    const uploaded = await this.cloudinary.uploadIdeaAttachment(file, id);

    try {
      await this.prisma.$transaction(async tx => {
        const existingCount = await tx.ideaMedia.count({
          where: { ideaId: id, kind: MediaKind.ATTACHMENT },
        });

        await tx.ideaMedia.create({
          data: {
            ideaId: id,
            kind: MediaKind.ATTACHMENT,
            provider: MediaProvider.CLOUDINARY,
            url: uploaded.url,
            publicId: uploaded.publicId,
            mimeType: file.mimetype,
            byteSize: file.size,
            originalFilename: file.originalname || 'attachment',
            sortOrder: existingCount,
          },
        });
      });
    } catch (err) {
      await this.cloudinary.deleteByPublicId(uploaded.publicId).catch(() => {});
      throw err;
    }

    return this.ideaQueryService.findByIdSmart(id, authorId);
  }

  async deleteMedia(
    id: string,
    mediaId: string,
    authorId: string,
  ): Promise<void> {
    const idea = await this.prisma.idea.findFirst({
      where: { id, authorId },
      select: { id: true },
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    const media = await this.prisma.ideaMedia.findFirst({
      where: { id: mediaId, ideaId: id },
      select: { id: true, publicId: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.prisma.ideaMedia.delete({ where: { id: mediaId } });
    void this.cloudinary.deleteByPublicId(media.publicId);
  }
}
