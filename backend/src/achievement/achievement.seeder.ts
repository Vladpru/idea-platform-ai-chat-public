import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ACHIEVEMENT_DEFINITIONS } from './lib/achievement-criteria';

@Injectable()
export class AchievementSeeder implements OnModuleInit {
  private readonly logger = new Logger(AchievementSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      await this.prisma.achievement.upsert({
        where: { key: def.key },
        update: {
          name: def.name,
          description: def.description,
          iconPath: def.iconPath,
          threshold: def.threshold,
        },
        create: {
          key: def.key,
          name: def.name,
          description: def.description,
          iconPath: def.iconPath,
          threshold: def.threshold,
        },
      });
    }

    this.logger.log('Achievement definitions seeded');
  }
}
