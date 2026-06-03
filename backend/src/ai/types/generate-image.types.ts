export const IMAGE_ASPECT_RATIOS = [
  '1:1',
  '3:2',
  '2:3',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
] as const;

export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];

export type GenerateImageInput = {
  prompt: string;
  title?: string;
  description?: string;
  aspectRatio?: ImageAspectRatio;
};

export type GenerateImageOutput = {
  base64: string;
  mimeType: string;
};
