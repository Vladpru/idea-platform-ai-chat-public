import { BadRequestException } from '@nestjs/common';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; //2mb

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export function extensionForAvatarMime(mimetype: string): string {
  const key = mimetype?.trim().toLowerCase().split(';')[0] ?? '';
  const ext = MIME_TO_EXT[key];
  if (!ext) {
    throw new BadRequestException('Use a JPEG, PNG, GIF, or WebP image.');
  }
  return ext;
}
