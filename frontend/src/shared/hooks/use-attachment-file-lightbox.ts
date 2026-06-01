import {
  getAttachmentFileKey,
  isImageAttachment,
} from '@/features/ideas/lib/create-idea/attachments';
import { useCallback, useEffect, useMemo, useState } from 'react';

type LightboxImage = {
  url: string;
  alt: string;
};

type LightboxState = {
  initialIndex: number;
  images: LightboxImage[];
};

export function useAttachmentFileLightbox(files: File[]) {
  const imageFiles = useMemo(
    () => files.filter(file => isImageAttachment(file)),
    [files],
  );
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    return () => {
      lightbox.images.forEach(image => URL.revokeObjectURL(image.url));
    };
  }, [lightbox]);

  const closeLightbox = useCallback(() => {
    setLightbox(current => {
      if (current) {
        current.images.forEach(image => URL.revokeObjectURL(image.url));
      }
      return null;
    });
  }, []);

  const openFile = useCallback(
    (file: File) => {
      if (!isImageAttachment(file)) {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      const index = imageFiles.findIndex(
        candidate =>
          getAttachmentFileKey(candidate) === getAttachmentFileKey(file),
      );
      if (index < 0) return;

      setLightbox(current => {
        current?.images.forEach(image => URL.revokeObjectURL(image.url));
        return {
          initialIndex: index,
          images: imageFiles.map(candidate => ({
            url: URL.createObjectURL(candidate),
            alt: candidate.name,
          })),
        };
      });
    },
    [imageFiles],
  );

  return {
    openFile,
    closeLightbox,
    lightbox,
  };
}
