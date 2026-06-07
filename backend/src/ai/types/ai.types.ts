import type { IdeaPrefillMode } from '../../idea/dto/generate-idea-prefill.dto';

import { DocumentEntityType } from '../document/dto/extract-document.dto';

export { DocumentEntityType };

export type {
  GenerateImageInput,
  GenerateImageOutput,
  ImageAspectRatio,
} from './generate-image.types';
export { IMAGE_ASPECT_RATIOS } from './generate-image.types';

export type IdeaPrefillInput = {
  mode: IdeaPrefillMode;
  userPrompt: string;
  title?: string;
  description?: string;
};

export type IdeaPrefillOutput = {
  title: string;
  description: string;
  problemStatement: string;
  tags: string[];
};

export type DocumentExtractInput = {
  documentText: string;
  entityType: DocumentEntityType;
};

export type IdeaDocumentExtractOutput = {
  title: string;
  description: string;
  tags: string[];
};

export type ProblemDocumentExtractOutput = {
  title: string;
  description: string;
  valueProposition: string;
  costBenefit: string;
  tags: string[];
};

export type DocumentExtractOutput =
  | IdeaDocumentExtractOutput
  | ProblemDocumentExtractOutput;

export type DocumentExtractMeta = {
  documentTextTruncated: boolean;
};

export type DocumentExtractResult = {
  data: DocumentExtractOutput;
  meta: DocumentExtractMeta;
};

export type SuggestTagsInput = {
  title?: string;
  description: string;
  knownTags?: string[];
};

export interface AiProvider {
  generateIdeaPrefill(input: IdeaPrefillInput): Promise<IdeaPrefillOutput>;
}
