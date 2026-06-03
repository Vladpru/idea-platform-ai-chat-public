export type GeminiContentPart = {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
};

export type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiContentPart[];
    };
  }>;
};

export type GeminiErrorBody = {
  error?: {
    message?: string;
    status?: string;
    code?: number;
  };
};
