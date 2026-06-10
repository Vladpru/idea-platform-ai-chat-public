import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { Button } from '@/shared/ui/button';
import { ROUTES } from '@/shared/config/paths';
import type { ProblemDashboardCard } from '@/features/problems-dashboard/model/problems-dashboard.types';
import { AppDropdown, type DropdownItem } from '@/shared/ui/AppDropdown';

type ProblemCardActionsProps = {
  card: ProblemDashboardCard;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
};

export function ProblemCardActions({
  card,
  onDelete,
  isDeleting = false,
}: ProblemCardActionsProps) {
  const navigate = useNavigate();

  const isDraft = card.status === 'DRAFT';
  if (!card.isAuthor) return null;

  const items: DropdownItem[] = [
    {
      label: isDraft ? 'Continue editing' : 'Edit problem',
      icon: <Edit2 className="size-4" />,
      onSelect: () => {
        void navigate({
          to: ROUTES.problemsNew,
          search: { problemId: card.id },
        });
      },
    },
    {
      label: isDeleting ? 'Deleting...' : 'Delete problem',
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
