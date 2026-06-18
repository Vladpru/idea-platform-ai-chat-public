import type { ImageAspectRatio } from '../../ai/types/generate-image.types';

export const DEFAULT_DEAPI_BASE_URL = 'https://api.deapi.ai';

export const DEAPI_PROMPT_IMAGE_PATH = '/api/v1/client/prompt/image';
export const DEAPI_TXT2IMG_PATH = '/api/v1/client/txt2img';
export const DEAPI_REQUEST_STATUS_PATH = '/api/v1/client/request-status';

export const DEAPI_FLUX_SCHNELL_MODEL = 'Flux1schnell';

export const DEAPI_DEFAULT_NEGATIVE_PROMPT =
  'blurry, low quality, text, watermark, logo, distorted';

export const DEAPI_FLUX_SCHNELL_STEPS = 4;
export const DEAPI_FLUX_SCHNELL_GUIDANCE = 3.5;

export const DEAPI_ASPECT_RATIO_DIMENSIONS: Record<
  ImageAspectRatio,
  { width: number; height: number }
> = {
  '1:1': { width: 1024, height: 1024 },
  '3:2': { width: 1152, height: 768 },
  '2:3': { width: 768, height: 1152 },
  '3:4': { width: 896, height: 1152 },
  '4:3': { width: 1152, height: 896 },
  '4:5': { width: 896, height: 1152 },
  '5:4': { width: 1152, height: 896 },
  '9:16': { width: 768, height: 1280 },
  '16:9': { width: 1280, height: 768 },
  '21:9': { width: 1536, height: 640 },
};

export const DEAPI_DEFAULT_ASPECT_RATIO: ImageAspectRatio = '16:9';
