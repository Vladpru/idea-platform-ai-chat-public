import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import {
  AVATAR_MAX_BYTES,
  extensionForAvatarMime,
} from '../utils/avatar-upload.util';

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

    storage: memoryStorage(),
  });
}
