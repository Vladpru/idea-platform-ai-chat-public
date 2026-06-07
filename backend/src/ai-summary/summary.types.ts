export type SummaryEntityType = 'idea' | 'problem';

export type SummaryRequestedEvent = {
  entityType: SummaryEntityType;
  id: string;
};

export type IdeaSubstantialExisting = {
  title: string | null;
  description: string | null;
};

export type ProblemSubstantialExisting = {
  title: string;
  description: string;
  valueProposition: string | null;
  category: string | null;
  impact: string | null;
};

export type IdeaSubstantialUpdate = {
  title?: string;
  description?: string;
};

export type ProblemSubstantialUpdate = {
  title?: string;
  description?: string;
  valueProposition?: string;
  category?: string;
  impact?: string;
};

export type EntitySummaryContent = {
  entityType: SummaryEntityType;
  title: string | null;
  description: string | null;
  valueProposition?: string | null;
  category?: string | null;
  impact?: string | null;
};
