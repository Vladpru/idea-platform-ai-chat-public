import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants as fsConstants } from 'fs';
import { access, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

const AVATAR_SUBDIR = join('storage', 'avatars');

@Injectable()
export class LocalAvatarStorageService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureAvatarsDir();
  }

  avatarsDir(): string {
    return join(process.cwd(), AVATAR_SUBDIR);
  }

  async ensureAvatarsDir(): Promise<void> {
    const dir = this.avatarsDir();
    try {
      await access(dir, fsConstants.W_OK);
    } catch {
      await mkdir(dir, { recursive: true });
    }
  }

  publicAppBaseUrl(): string {
    const explicit = this.config.get<string>('APP_PUBLIC_URL');
    if (typeof explicit === 'string' && explicit.trim().length > 0) {
      return explicit.replace(/\/+$/, '');
    }
    const port = this.config.get<number>('APP_PORT') ?? 3001;
    return `http://localhost:${port}`;
  }

  publicUrlForFilename(filename: string): string {
    return `${this.publicAppBaseUrl()}/files/avatars/${filename}`;
  }

  async removeStaleAvatarVariants(
    userId: string,
    keptFilename: string,
  ): Promise<void> {
    const dir = this.avatarsDir();
    const exts = ['jpg', 'jpeg', 'png', 'webp'] as const;
    for (const ext of exts) {
      const name = `${userId}.${ext}`;
      if (name === keptFilename) {
        continue;
      }
      try {
        await unlink(join(dir, name));
      } catch {
        // ignore missing files
      }
    }
  }
}
