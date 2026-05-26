import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { GlobalSearchQueryDto } from './dto/global-search-query.dto';
import { GlobalSearchResultResponse } from './interfaces/search-result.interface';
import { SearchService } from './search.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Global full-text search across Ideas and Problems',
  })
  @ApiOkResponse({ description: 'Paginated search results' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  search(
    @Query() dto: GlobalSearchQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GlobalSearchResultResponse> {
    return this.searchService.search(dto, req.user.id);
  }
}
