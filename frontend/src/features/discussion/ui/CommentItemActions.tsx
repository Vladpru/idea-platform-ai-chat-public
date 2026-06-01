import { useMemo } from 'react';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';

import { AppDropdown, type DropdownItem } from '@/shared/ui/AppDropdown';
import { Button } from '@/shared/ui/button';

type CommentItemActionsProps = {
  isMutating: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const EDIT_ICON = <Edit2 className="size-4" />;
const DELETE_ICON = <Trash2 className="size-4" />;

const TRIGGER_CLASS =
  'group/btn border-brand-dark-blue hover:bg-brand-dark-blue focus-visible:ring-brand-orange h-8 w-8 shrink-0 rounded-md border bg-white focus-visible:ring-2';

export function CommentItemActions({
  isMutating,
  onEdit,
  onDelete,
}: CommentItemActionsProps) {
  const items = useMemo<DropdownItem[]>(
    () => [
      {
        label: 'Edit',
        icon: EDIT_ICON,
        disabled: isMutating,
        onSelect: onEdit,
      },
      {
        label: 'Delete',
        icon: DELETE_ICON,
        variant: 'danger',
        disabled: isMutating,
        onSelect: onDelete,
      },
    ],
    [isMutating, onEdit, onDelete],
  );

  const trigger = useMemo(
    () => (
      <Button
        variant="ghost"
        size="icon"
        className={TRIGGER_CLASS}
        disabled={isMutating}
      >
        <MoreVertical className="text-brand-dark-blue size-4 transition-colors group-hover/btn:text-white" />
        <span className="sr-only">Comment actions</span>
      </Button>
    ),
    [isMutating],
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
