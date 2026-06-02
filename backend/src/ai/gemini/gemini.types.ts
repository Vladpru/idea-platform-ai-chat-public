export type GeminiTextPart = { text?: string };

export type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiTextPart[];
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
