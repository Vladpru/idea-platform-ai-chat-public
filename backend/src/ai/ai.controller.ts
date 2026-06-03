import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/** Gemini text prefill and related AI routes can be added here later. */
@ApiTags('ai')
@Controller('ai')
export class AiController {}
