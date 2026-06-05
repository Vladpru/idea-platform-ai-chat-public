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

export type DocumentExtractMeta = {
  documentTextTruncated: boolean;
};

export type IdeaDocumentExtractResult = {
  data: IdeaDocumentExtractResponse;
  meta: DocumentExtractMeta;
};

export type ProblemDocumentExtractResult = {
  data: ProblemDocumentExtractResponse;
  meta: DocumentExtractMeta;
};

export type DocumentExtractResult =
  | IdeaDocumentExtractResult
  | ProblemDocumentExtractResult;

export type DocumentExtractDataByEntity = {
  idea: IdeaDocumentExtractResponse;
  problem: ProblemDocumentExtractResponse;
};
