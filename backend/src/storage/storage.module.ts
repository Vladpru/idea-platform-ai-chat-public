import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LocalAvatarStorageService } from './local-avatar-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [LocalAvatarStorageService],
  exports: [LocalAvatarStorageService],
})
export class StorageModule {}
