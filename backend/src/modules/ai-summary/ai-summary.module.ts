import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { AiSummaryListener } from './ai-summary.listener';
import { AiSummaryService } from './ai-summary.service';

@Module({
  imports: [AiModule],
  providers: [AiSummaryService, AiSummaryListener],
  exports: [AiSummaryService],
})
export class AiSummaryModule {}
