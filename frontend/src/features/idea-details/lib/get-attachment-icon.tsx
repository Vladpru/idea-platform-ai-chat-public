import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function getAttachmentIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith('image/')) {
    return FileImage;
  }
  if (mimeType.startsWith('video/')) {
    return FileVideo;
  }
  if (
    mimeType.includes('pdf') ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('word')
  ) {
    return FileText;
  }
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('csv')
  ) {
    return FileSpreadsheet;
  }
  return File;
}
