import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  IMAGE_ASPECT_RATIOS,
  type ImageAspectRatio,
} from '../types/generate-image.types';

export { IMAGE_ASPECT_RATIOS, type ImageAspectRatio };

export class GenerateImageDto {
  @ApiProperty({
    example: 'A friendly illustration of neighbors sharing tools',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  prompt!: string;

  @ApiPropertyOptional({ example: 'Community Share Hub' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'A local platform for lending household items between neighbors.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    enum: IMAGE_ASPECT_RATIOS,
    example: '16:9',
  })
  @IsOptional()
  @IsIn(IMAGE_ASPECT_RATIOS)
  aspectRatio?: ImageAspectRatio;
}

export class GeneratedImageDataDto {
  @ApiProperty({
    description: 'Base64-encoded image bytes (no data: URL prefix)',
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  })
  base64!: string;

  @ApiProperty({ example: 'image/png' })
  mimeType!: string;
}

export class GenerateImageResponseDto {
  @ApiProperty({ type: () => GeneratedImageDataDto })
  data!: GeneratedImageDataDto;
}
