import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum DocumentEntityType {
  IDEA = 'idea',
  PROBLEM = 'problem',
}

export class ExtractDocumentDto {
  @ApiProperty({ enum: DocumentEntityType, example: DocumentEntityType.IDEA })
  @IsEnum(DocumentEntityType)
  entityType!: DocumentEntityType;
}

export class ExtractDocumentMultipartDto extends ExtractDocumentDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: Express.Multer.File;
}

export class IdeaDocumentExtractDataDto {
  @ApiProperty({ example: 'Neighborhood Share Hub' })
  title!: string;

  @ApiProperty({
    example:
      'A local platform where neighbors can request, lend, and track shared items.',
  })
  description!: string;

  @ApiProperty({
    type: [String],
    example: ['community', 'sharing', 'local'],
  })
  tags!: string[];
}

export class ProblemDocumentExtractDataDto {
  @ApiProperty({ example: 'Slow internal approvals' })
  title!: string;

  @ApiProperty({
    example: 'Teams wait days for approval because requests are scattered.',
  })
  description!: string;

  @ApiProperty({
    example: 'A single queue would cut wait time and improve visibility.',
  })
  valueProposition!: string;

  @ApiProperty({ example: '50000' })
  costBenefit!: string;

  @ApiProperty({
    type: [String],
    example: ['operations', 'workflow'],
  })
  tags!: string[];
}

export class IdeaDocumentExtractResponseDto {
  @ApiProperty({ type: () => IdeaDocumentExtractDataDto })
  data!: IdeaDocumentExtractDataDto;
}

export class ProblemDocumentExtractResponseDto {
  @ApiProperty({ type: () => ProblemDocumentExtractDataDto })
  data!: ProblemDocumentExtractDataDto;
}

export class DocumentExtractMetaDto {
  @ApiProperty({
    description:
      'True when document text exceeded the analysis limit and was truncated before extraction',
    example: false,
  })
  documentTextTruncated!: boolean;
}
