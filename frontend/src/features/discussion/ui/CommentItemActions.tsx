'use client';

import { Edit2, MoreVertical, Trash2 } from 'lucide-react';

import { AppDropdown, type DropdownItem } from '@/shared/ui/AppDropdown';
import { Button } from '@/shared/ui/button';

type CommentItemActionsProps = {
  isMutating: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function CommentItemActions({
  isMutating,
  onEdit,
  onDelete,
}: CommentItemActionsProps) {
  const items: DropdownItem[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="size-4" />,
      disabled: isMutating,
      onSelect: onEdit,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="size-4" />,
      variant: 'danger',
      disabled: isMutating,
      onSelect: onDelete,
    },
  ];

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="group/btn border-brand-dark-blue hover:bg-brand-dark-blue focus-visible:ring-brand-orange h-8 w-8 shrink-0 rounded-md border bg-white focus-visible:ring-2"
      disabled={isMutating}
    >
      <MoreVertical className="text-brand-dark-blue size-4 transition-colors group-hover/btn:text-white" />
      <span className="sr-only">Comment actions</span>
    </Button>
  );

  return (
    <AppDropdown
      items={items}
      trigger={trigger}
      align="end"
      contentClassName="w-48"
    />
  );
}
