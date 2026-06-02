import type { KeyboardEvent } from 'react';

type ComboboxKeyboardActions = {
  onToggle: () => void;
  onClose: () => void;
};

export function handleComboboxKeyboard(
  event: KeyboardEvent<HTMLElement>,
  actions: ComboboxKeyboardActions,
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    actions.onToggle();
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    actions.onClose();
    (event.currentTarget as HTMLElement).blur();
  }
}

export function handleSearchInputEscape(
  event: KeyboardEvent<HTMLInputElement>,
  onClose: () => void,
): void {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  onClose();
  event.currentTarget.blur();
}
