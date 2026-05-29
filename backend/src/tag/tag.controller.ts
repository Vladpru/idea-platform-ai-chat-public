import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { TagResponseDto } from './dto/tag-response.dto';
import { TagService } from './tag.service';
import type { TagListItem } from './types/tag.types';

@ApiTags('tags')
@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tags' })
  @ApiOkResponse({ type: TagResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(): Promise<TagListItem[]> {
    return this.tagService.findAll();
  }
}
