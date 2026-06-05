import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { Button } from '@/shared/ui/button';
import { ROUTES } from '@/shared/config/paths';
import { IDEA_STATUS } from '@/features/ideas/model/idea.types';
import type { IdeaDashboardCard } from '@/features/ideas-dashboard/model/ideas-dashboard.types';
import { AppDropdown, type DropdownItem } from '@/shared/ui/AppDropdown';

type IdeaCardActionsProps = {
  card: IdeaDashboardCard;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
};

export function IdeaCardActions({
  card,
  onDelete,
  isDeleting = false,
}: IdeaCardActionsProps) {
  const navigate = useNavigate();
  const isDraft = card.status === IDEA_STATUS.DRAFT;
  if (!card.isAuthor) return null;

  const items: DropdownItem[] = [
    {
      label: isDraft ? 'Continue editing' : 'Edit idea',
      icon: <Edit2 className="size-4" />,
      onSelect: () => {
        if (isDraft) {
          void navigate({
            to: ROUTES.ideasNew,
            search: { ideaId: card.id },
          });
          return;
        }

        void navigate({
          to: '/ideas/$ideaId',
          params: { ideaId: card.id },
          search: { edit: true },
        });
      },
    },
    {
      label: isDeleting ? 'Deleting...' : 'Delete idea',
      icon: <Trash2 className="size-4" />,
      variant: 'danger',
      disabled: isDeleting,
      onSelect: () => onDelete?.(card.id),
    },
  ];

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="group/btn border-brand-dark-blue hover:bg-brand-dark-blue focus-visible:ring-brand-orange bg-card h-8 w-8 shrink-0 rounded-md border focus-visible:ring-2"
    >
      <MoreVertical className="text-brand-dark-blue size-4 transition-colors group-hover/btn:text-white" />
      <span className="sr-only">Open menu</span>
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
