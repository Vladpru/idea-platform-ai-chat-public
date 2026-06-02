import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum IdeaPrefillMode {
  DRAFT = 'draft',
  TITLE = 'title',
  DESCRIPTION = 'description',
}

export class GenerateIdeaPrefillDto {
  @ApiProperty({
    enum: IdeaPrefillMode,
    example: IdeaPrefillMode.DRAFT,
  })
  @IsEnum(IdeaPrefillMode)
  mode!: IdeaPrefillMode;

  @ApiProperty({
    example: 'An app for neighborhood item sharing',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  userPrompt!: string;

  @ApiPropertyOptional({ example: 'Community Share' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'People need a quick way to lend and borrow household items.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}

export class IdeaPrefillDataDto {
  @ApiProperty({ example: 'Neighborhood Share Hub' })
  title!: string;

  @ApiProperty({
    example:
      'A local platform where neighbors can request, lend, and track shared items.',
  })
  description!: string;

  @ApiProperty({
    example:
      'Residents often buy items they only need occasionally because borrowing is hard to coordinate.',
  })
  problemStatement!: string;

  @ApiProperty({
    type: [String],
    example: ['community', 'sharing', 'local'],
  })
  tags!: string[];
}

export class IdeaPrefillResponseDto {
  @ApiProperty({ type: () => IdeaPrefillDataDto })
  data!: IdeaPrefillDataDto;
}
