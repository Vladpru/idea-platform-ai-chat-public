import { Module } from '@nestjs/common';

import { EntityVisibilityModule } from '../entity-visibility/entity-visibility.module';
import { LivekitModule } from '../livekit/livekit.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConferenceInviteController } from './conference-invite.controller';
import { ConferenceInviteRepository } from './conference-invite.repository';
import { ConferenceInviteService } from './conference-invite.service';
import { ConferenceWebhookController } from './conference-webhook.controller';
import { ConferenceRepository } from './conference.repository';
import { ConferenceService } from './conference.service';
import { IdeaConferenceController } from './idea-conference.controller';
import { ProblemConferenceController } from './problem-conference.controller';

@Module({
  imports: [PrismaModule, EntityVisibilityModule, LivekitModule, MailModule],
  controllers: [
    IdeaConferenceController,
    ProblemConferenceController,
    ConferenceInviteController,
    ConferenceWebhookController,
  ],
  providers: [
    ConferenceRepository,
    ConferenceService,
    ConferenceInviteRepository,
    ConferenceInviteService,
  ],
  exports: [ConferenceService, ConferenceInviteService],
})
export class ConferenceModule {}
