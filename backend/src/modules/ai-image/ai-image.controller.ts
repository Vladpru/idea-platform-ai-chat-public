import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  GenerateImageDto,
  GenerateImageResponseDto,
} from '../ai/dto/generate-image.dto';
import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { AiImageService } from './ai-image.service';

@ApiTags('ai-image')
@Controller('ai-image')
export class AiImageController {
  constructor(private readonly aiImageService: AiImageService) {}

  @Post('generate')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate an image from a text prompt (deAPI FLUX.1 Schnell)',
  })
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
