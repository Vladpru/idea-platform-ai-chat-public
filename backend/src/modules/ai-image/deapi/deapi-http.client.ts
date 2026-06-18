import {
  DEAPI_PROMPT_IMAGE_PATH,
  DEAPI_REQUEST_STATUS_PATH,
  DEAPI_TXT2IMG_PATH,
  DEFAULT_DEAPI_BASE_URL,
} from './deapi.constants';

type DeapiRequestOptions = {
  apiKey: string;
  baseUrl?: string;
  path: string;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  signal?: AbortSignal;
};

export function deapiRequest({
  apiKey,
  baseUrl = DEFAULT_DEAPI_BASE_URL,
  path,
  method = 'POST',
  body,
  signal,
}: DeapiRequestOptions): Promise<Response> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;

  return fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
}

export function postDeapiPromptImage(
  apiKey: string,
  prompt: string,
  options?: { baseUrl?: string; negativePrompt?: string; signal?: AbortSignal },
): Promise<Response> {
  return deapiRequest({
    apiKey,
    baseUrl: options?.baseUrl,
    path: DEAPI_PROMPT_IMAGE_PATH,
    body: {
      prompt,
      ...(options?.negativePrompt
        ? { negative_prompt: options.negativePrompt }
        : {}),
    },
    signal: options?.signal,
  });
}

export function postDeapiTxt2Img(
  apiKey: string,
  body: Record<string, unknown>,
  options?: { baseUrl?: string; signal?: AbortSignal },
): Promise<Response> {
  return deapiRequest({
    apiKey,
    baseUrl: options?.baseUrl,
    path: DEAPI_TXT2IMG_PATH,
    body,
    signal: options?.signal,
  });
}

export function getDeapiRequestStatus(
  apiKey: string,
  requestId: string,
  options?: { baseUrl?: string; signal?: AbortSignal },
): Promise<Response> {
  return deapiRequest({
    apiKey,
    baseUrl: options?.baseUrl,
    path: `${DEAPI_REQUEST_STATUS_PATH}/${requestId}`,
    method: 'GET',
    signal: options?.signal,
  });
}
