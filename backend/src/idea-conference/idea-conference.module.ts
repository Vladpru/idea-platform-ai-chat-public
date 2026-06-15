import { Module } from '@nestjs/common';

import { EntityVisibilityModule } from '../entity-visibility/entity-visibility.module';
import { LivekitModule } from '../livekit/livekit.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConferenceInviteController } from './conference-invite.controller';
import { ConferenceInviteRepository } from './conference-invite.repository';
import { ConferenceInviteService } from './conference-invite.service';
import { IdeaConferenceWebhookController } from './idea-conference-webhook.controller';
import { IdeaConferenceController } from './idea-conference.controller';
import { IdeaConferenceRepository } from './idea-conference.repository';
import { IdeaConferenceService } from './idea-conference.service';

@Module({
  imports: [PrismaModule, EntityVisibilityModule, LivekitModule, MailModule],
  controllers: [
    IdeaConferenceController,
    ConferenceInviteController,
    IdeaConferenceWebhookController,
  ],
  providers: [
    IdeaConferenceRepository,
    IdeaConferenceService,
    ConferenceInviteRepository,
    ConferenceInviteService,
  ],
  exports: [IdeaConferenceService, ConferenceInviteService],
})
export class IdeaConferenceModule {}
