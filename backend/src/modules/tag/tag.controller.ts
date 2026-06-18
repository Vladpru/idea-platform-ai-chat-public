import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { SuggestTagsQueryDto } from './dto/suggest-tags-query.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import { TagSuggestionService } from './tag-suggestion.service';
import { TagService } from './tag.service';
import type { SuggestTagsResponse } from './types/tag-suggestion.types';
import type { TagListItem } from './types/tag.types';

@ApiTags('tags')
@Controller('tag')
export class TagController {
  constructor(
    private readonly tagService: TagService,
    private readonly tagSuggestionService: TagSuggestionService,
  ) {}

  @Get()
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tags' })
  @ApiOkResponse({ type: TagResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(): Promise<TagListItem[]> {
    return this.tagService.findAll();
  }

  @Get('suggestions')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Suggest tags for idea or problem create/edit forms',
  })
  @ApiOkResponse({
    description: 'Ranked tag suggestions with confidence tiers',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getSuggestions(
    @Query() query: SuggestTagsQueryDto,
  ): Promise<SuggestTagsResponse> {
    return this.tagSuggestionService.suggestTags(query);
  }
}
