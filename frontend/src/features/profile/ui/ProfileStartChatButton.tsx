import { useStartDirectChatMutation } from '@/features/live-chat/hooks/mutations/use-start-direct-chat-mutation';
import { outlineBtn } from '@/features/profile/ui/shared/profile-view-classes';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type ProfileStartChatButtonProps = {
  userId: string;
  className?: string;
};

export function ProfileStartChatButton({
  userId,
  className,
}: ProfileStartChatButtonProps) {
  const startChatMutation = useStartDirectChatMutation();

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(outlineBtn, 'cursor-pointer', className)}
      disabled={startChatMutation.isPending}
      isLoading={startChatMutation.isPending}
      onClick={() => startChatMutation.mutate(userId)}
    >
      Start chat
    </Button>
  );
}
