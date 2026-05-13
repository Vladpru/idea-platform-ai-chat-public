import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';

import {
  AVATAR_MAX_BYTES,
  extensionForAvatarMime,
} from '../utils/avatar-upload.util';

const avatarsFolder = () => join(process.cwd(), 'storage', 'avatars');

export function AvatarUploadInterceptor() {
  return FileInterceptor('file', {
    limits: { fileSize: AVATAR_MAX_BYTES },
    fileFilter: (_req, file, cb) => {
      try {
        extensionForAvatarMime(file.mimetype);
        cb(null, true);
      } catch (err) {
        cb(err as Error, false);
      }
    },
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, avatarsFolder()),
      filename: (req, file, cb) => {
        try {
          const id = (req as Request & { user: { id: string } }).user.id;
          const ext = extensionForAvatarMime(file.mimetype);
          cb(null, `${id}.${ext}`);
        } catch (err) {
          cb(err as Error, '');
        }
      },
    }),
  });
}
