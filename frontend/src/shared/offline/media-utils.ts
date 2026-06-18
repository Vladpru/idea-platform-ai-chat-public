export const MAX_MEDIA_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1920;
export const IMAGE_QUALITY = 0.8;

const COMPRESSIBLE_IMAGE = /^image\/(jpe?g|png|webp|bmp)$/i;

export class MediaTooLargeError extends Error {
  readonly byteSize: number;

  constructor(byteSize: number) {
    const mb = (byteSize / 1024 / 1024).toFixed(1);
    const limit = (MAX_MEDIA_BYTES / 1024 / 1024).toFixed(0);
    super(
      `This file is too large to save offline (${mb}MB after compression; limit ${limit}MB). Please choose a smaller file.`,
    );
    this.name = 'MediaTooLargeError';
    this.byteSize = byteSize;
  }
}

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

let cachedWebpSupport: boolean | null = null;
function supportsWebpEncoding(): boolean {
  if (cachedWebpSupport !== null) return cachedWebpSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    cachedWebpSupport = canvas
      .toDataURL('image/webp')
      .startsWith('data:image/webp');
  } catch {
    cachedWebpSupport = false;
  }
  return cachedWebpSupport;
}

function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image'));
    };
    image.src = url;
  });
}

function scaledSize(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height };
  const scale = Math.min(max / width, max / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), type, quality);
  });
}

export async function compressImage(
  source: File | Blob,
  options?: CompressImageOptions,
): Promise<Blob> {
  if (!COMPRESSIBLE_IMAGE.test(source.type || '')) {
    return source;
  }

  const maxDimension = options?.maxDimension ?? MAX_IMAGE_DIMENSION;
  const quality = options?.quality ?? IMAGE_QUALITY;

  let image: HTMLImageElement;
  try {
    image = await loadImageElement(source);
  } catch {
    return source;
  }

  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (!naturalWidth || !naturalHeight) return source;

  const { width, height } = scaledSize(
    naturalWidth,
    naturalHeight,
    maxDimension,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return source;
  context.drawImage(image, 0, 0, width, height);

  const outputType = supportsWebpEncoding() ? 'image/webp' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, outputType, quality);

  if (!blob || blob.size >= source.size) return source;
  return blob;
}

function extensionForType(type: string): string | null {
  if (type === 'image/webp') return 'webp';
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  return null;
}

function renameForType(originalName: string, type: string): string {
  const fallback = originalName || 'upload';
  const ext = extensionForType(type);
  if (!ext) return fallback;
  return `${fallback.replace(/\.[^./\\]+$/, '')}.${ext}`;
}

export async function prepareUploadFile(file: File): Promise<File> {
  const blob = await compressImage(file);

  if (blob.size > MAX_MEDIA_BYTES) {
    throw new MediaTooLargeError(blob.size);
  }

  if (blob === (file as Blob)) {
    return file;
  }

  const outputType = blob.type || file.type || 'application/octet-stream';
  return new File([blob], renameForType(file.name, outputType), {
    type: outputType,
    lastModified: Date.now(),
  });
}
