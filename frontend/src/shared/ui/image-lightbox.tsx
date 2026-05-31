'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type ImageLightboxProps = {
  images: { url: string; alt: string }[];
  initialIndex: number;
  onClose: () => void;
};

const swipeConfidenceThreshold = 10000;

const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: ImageLightboxProps) {
  const [[page, direction], setPage] = useState([initialIndex, 0]);
  const imageIndex = ((page % images.length) + images.length) % images.length;
  const isMultiple = images.length > 1;

  const handleNext = useCallback(() => setPage(prev => [prev[0] + 1, 1]), []);
  const handlePrev = useCallback(() => setPage(prev => [prev[0] - 1, -1]), []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight' && isMultiple) {
        handleNext();
      } else if (event.key === 'ArrowLeft' && isMultiple) {
        handlePrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev, onClose, isMultiple]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 z-20 text-white hover:text-gray-300"
        onClick={event => {
          event.stopPropagation();
          onClose();
        }}
      >
        <X />
      </button>

      {isMultiple ? (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 text-white hover:text-gray-300"
            onClick={event => {
              event.stopPropagation();
              handlePrev();
            }}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 text-white hover:text-gray-300"
            onClick={event => {
              event.stopPropagation();
              handleNext();
            }}
          >
            <ChevronRight />
          </button>
        </>
      ) : null}

      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={page}
          src={images[imageIndex].url}
          alt={images[imageIndex].alt}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag={isMultiple ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_event, { offset, velocity }) => {
            if (!isMultiple) return;
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              handleNext();
            } else if (swipe > swipeConfidenceThreshold) {
              handlePrev();
            }
          }}
          className="absolute max-h-[90vh] max-w-[90vw] object-contain"
          onClick={event => event.stopPropagation()}
        />
      </AnimatePresence>
    </div>
  );
}
