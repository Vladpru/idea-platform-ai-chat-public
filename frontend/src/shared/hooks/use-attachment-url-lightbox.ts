import { useCallback, useMemo, useState } from 'react';

export type AttachmentUrlPreview = {
  id: string;
  url: string;
  alt: string;
};

function isImageFilename(filename: string, mimeTypeHint?: string): boolean {
  return (
    mimeTypeHint?.startsWith('image/') === true ||
    /\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i.test(filename)
  );
}

export function useAttachmentUrlLightbox(
  attachments: AttachmentUrlPreview[],
  mimeTypeById?: Record<string, string | undefined>,
) {
  const imageAttachments = useMemo(
    () =>
      attachments.filter(attachment =>
        isImageFilename(attachment.alt, mimeTypeById?.[attachment.id]),
      ),
    [attachments, mimeTypeById],
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openAttachment = useCallback(
    (attachment: AttachmentUrlPreview) => {
      const isImage = isImageFilename(
        attachment.alt,
        mimeTypeById?.[attachment.id],
      );

      if (!isImage) {
        window.open(attachment.url, '_blank', 'noopener,noreferrer');
        return;
      }

      const index = imageAttachments.findIndex(item => item.id === attachment.id);
      if (index >= 0) {
        setLightboxIndex(index);
      }
    },
    [imageAttachments, mimeTypeById],
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const lightboxImages = useMemo(
    () =>
      imageAttachments.map(attachment => ({
        url: attachment.url,
        alt: attachment.alt,
      })),
    [imageAttachments],
  );

  return {
    openAttachment,
    closeLightbox,
    lightboxIndex,
    lightboxImages,
  };
}
