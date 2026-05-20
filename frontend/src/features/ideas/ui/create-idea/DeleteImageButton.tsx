import React from 'react';

import { cn } from '@/shared/lib/utils';

import { TrashBin } from '../icons/TrashBin';

interface DeleteImageButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isBusy: boolean;
  variant?: 'default' | 'compact';
  className?: string;
  'aria-label'?: string;
}

const DeleteImageButton = ({
  onClick,
  isBusy,
  variant = 'default',
  className,
  'aria-label': ariaLabel = 'Delete image',
}: DeleteImageButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      aria-label={ariaLabel}
      className={cn(
        'bg-brand-orange hover:bg-brand-orange-hover absolute inline-flex cursor-pointer items-center justify-center rounded text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'default' && 'top-3 right-3 size-10',
        variant === 'compact' && '-top-2 -right-2 size-7',
        className,
      )}
    >
      <TrashBin
        className={variant === 'compact' ? 'size-4' : 'size-5'}
        aria-hidden
      />
    </button>
  );
};

export default DeleteImageButton;
