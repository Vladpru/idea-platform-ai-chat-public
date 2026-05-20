import type { CreateIdeaLocalFiles } from '@/features/ideas/model/idea.types';

import { getAttachmentFileKey } from './attachments';

export type PersistedFile = {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: string;
};

export type PersistedLocalFiles = {
  mainImage: PersistedFile | null;
  attachments: PersistedFile[];
};

export const EMPTY_PERSISTED_LOCAL_FILES: PersistedLocalFiles = {
  mainImage: null,
  attachments: [],
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }

      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to encode file'));
        return;
      }

      resolve(base64);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function getLocalFilesKey(localFiles: CreateIdeaLocalFiles): string {
  const mainKey = localFiles.mainImage
    ? `${localFiles.mainImage.name}-${localFiles.mainImage.size}-${localFiles.mainImage.lastModified}`
    : '';
  const attachmentKeys = localFiles.attachments
    .map(getAttachmentFileKey)
    .join('|');

  return `${mainKey}::${attachmentKeys}`;
}

export async function fileToPersisted(file: File): Promise<PersistedFile> {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    data: await readFileAsBase64(file),
  };
}

function inferMimeType(name: string, type: string): string {
  if (type) return type;

  const extension = name.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return extension ? (mimeTypes[extension] ?? '') : '';
}

export function persistedToFile(persisted: PersistedFile): File | null {
  if (!persisted.data) return null;

  const bytes = base64ToUint8Array(persisted.data);
  if (bytes.length === 0) return null;

  return new File([Uint8Array.from(bytes)], persisted.name, {
    type: inferMimeType(persisted.name, persisted.type),
    lastModified: persisted.lastModified,
  });
}

export async function localFilesToPersisted(
  localFiles: CreateIdeaLocalFiles,
): Promise<PersistedLocalFiles> {
  return {
    mainImage: localFiles.mainImage
      ? await fileToPersisted(localFiles.mainImage)
      : null,
    attachments: await Promise.all(
      localFiles.attachments.map(file => fileToPersisted(file)),
    ),
  };
}

export function persistedToLocalFiles(
  persisted: PersistedLocalFiles,
): CreateIdeaLocalFiles {
  return {
    mainImage: persisted.mainImage
      ? persistedToFile(persisted.mainImage)
      : null,
    attachments: persisted.attachments
      .map(persistedToFile)
      .filter((file): file is File => file !== null),
  };
}
