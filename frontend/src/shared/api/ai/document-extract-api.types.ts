export type DocumentExtractEntityType = 'idea' | 'problem';

export type IdeaDocumentExtractResponse = {
  title: string;
  description: string;
  tags: string[];
};

export type ProblemDocumentExtractResponse = {
  title: string;
  description: string;
  valueProposition: string;
  costBenefit: string;
  tags: string[];
};

export type DocumentExtractResponse =
  | IdeaDocumentExtractResponse
  | ProblemDocumentExtractResponse;
