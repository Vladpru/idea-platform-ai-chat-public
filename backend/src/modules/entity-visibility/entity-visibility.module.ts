import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { EntityVisibilityService } from './entity-visibility.service';

@Module({
  imports: [PrismaModule],
  providers: [EntityVisibilityService],
  exports: [EntityVisibilityService],
})
export class EntityVisibilityModule {}
