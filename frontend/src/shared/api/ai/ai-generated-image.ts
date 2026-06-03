const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function base64ToUint8Array(base64: string): Uint8Array | null {
  const normalized = base64.includes(',')
    ? base64.slice(base64.indexOf(',') + 1)
    : base64;
  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function createFileFromAiGeneratedImage(
  base64: string,
  mimeType: string,
): File | null {
  const normalizedMime = mimeType.trim().toLowerCase();
  const extension = MIME_TO_EXTENSION[normalizedMime];
  if (!extension) return null;

  const bytes = base64ToUint8Array(base64);
  if (!bytes || bytes.length === 0) return null;

  return new File([Uint8Array.from(bytes)], `ai-generated-cover.${extension}`, {
    type: normalizedMime,
    lastModified: Date.now(),
  });
}
