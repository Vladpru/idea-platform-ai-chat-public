export type DeapiPromptImageResponse = {
  prompt: string;
  negative_prompt?: string | null;
};

export type DeapiTxt2ImgResponse = {
  data: {
    request_id: string;
  };
};

export type DeapiJobStatus = 'pending' | 'processing' | 'done' | 'error';

export type DeapiRequestStatusResponse = {
  data: {
    status: DeapiJobStatus;
    result_url?: string | null;
    preview?: string | null;
    progress?: number;
  };
  message?: string;
};

export type DeapiErrorBody = {
  message?: string;
  errors?: unknown;
  statusCode?: number;
};
