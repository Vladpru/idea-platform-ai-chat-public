import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { AiImageService } from './ai-image.service';
import {
  GenerateImageDto,
  GenerateImageResponseDto,
} from './dto/generate-image.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiImageService: AiImageService) {}

  @Post('generate-image')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate an image from a text prompt' })
  @ApiBody({ type: GenerateImageDto })
  @ApiOkResponse({
    description: 'Base64 image payload suitable for upload or preview',
    type: GenerateImageResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async generateImage(@Body() dto: GenerateImageDto) {
    const data = await this.aiImageService.generateImage(dto);
    return { data };
  }
}
