import { IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PageContextDto {
  @IsString()
  @IsIn(['idea_form', 'problem_form'])
  type: 'idea_form' | 'problem_form';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  linkedProblemIds?: string[];
}

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PageContextDto)
  pageContext?: PageContextDto | null;
}
