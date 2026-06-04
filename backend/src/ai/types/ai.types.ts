import type { IdeaPrefillMode } from '../../idea/dto/generate-idea-prefill.dto';

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

export type SuggestTagsInput = {
  title?: string;
  description: string;
  knownTags?: string[];
};

export interface AiProvider {
  generateIdeaPrefill(input: IdeaPrefillInput): Promise<IdeaPrefillOutput>;
}
