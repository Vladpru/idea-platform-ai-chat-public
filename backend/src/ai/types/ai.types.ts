import type { IdeaPrefillMode } from '../../idea/dto/generate-idea-prefill.dto';

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

export interface AiProvider {
  generateIdeaPrefill(input: IdeaPrefillInput): Promise<IdeaPrefillOutput>;
}
