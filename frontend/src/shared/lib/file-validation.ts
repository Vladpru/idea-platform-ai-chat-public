export const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;

export function getFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function matchesAllowedMimeType(
  file: File,
  allowedMimeTypes: string[],
): boolean {
  if (allowedMimeTypes.length === 0) {
    return true;
  }

  if (allowedMimeTypes.includes(file.type)) {
    return true;
  }

  return allowedMimeTypes.some(allowed => {
    if (!allowed.endsWith('/*')) {
      return false;
    }
    const prefix = allowed.slice(0, -1);
    return file.type.startsWith(prefix);
  });
}

export function validateFileSize(
  file: File,
  maxBytes: number = DEFAULT_MAX_FILE_BYTES,
): string | null {
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return `Each file must be ${maxMb} MB or less`;
  }
  return null;
}

export function validateFile(
  file: File,
  options: {
    allowedMimeTypes: string[];
    maxBytes?: number;
    validateAllowed?: (file: File) => boolean;
    allowedMessage?: string;
  },
): string | null {
  const isAllowed =
    options.validateAllowed?.(file) ??
    matchesAllowedMimeType(file, options.allowedMimeTypes);

  if (!isAllowed) {
    return options.allowedMessage ?? 'File type is not allowed';
  }

  return validateFileSize(file, options.maxBytes ?? DEFAULT_MAX_FILE_BYTES);
}

export function mergeFiles(
  existing: File[],
  incoming: File[],
  options: {
    maxCount: number;
    validate: (file: File) => string | null;
    getKey?: (file: File) => string;
  },
): { merged: File[]; errors: string[] } {
  const errors: string[] = [];
  const merged = [...existing];
  const getKey = options.getKey ?? getFileKey;
  const existingKeys = new Set(existing.map(getKey));

  for (const file of incoming) {
    if (merged.length >= options.maxCount) {
      errors.push(
        `You can add up to ${options.maxCount} file${options.maxCount === 1 ? '' : 's'}`,
      );
      break;
    }

    const validationError = options.validate(file);
    if (validationError) {
      errors.push(`${file.name}: ${validationError}`);
      continue;
    }

    const key = getKey(file);
    if (existingKeys.has(key)) {
      continue;
    }

    existingKeys.add(key);
    merged.push(file);
  }

  return { merged, errors };
}
