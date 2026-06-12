import { useCreateVideoCallMutation } from '@/features/live-chat/hooks/mutations/use-create-video-call-mutation';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  DateTimePicker,
  getDefaultScheduleDateTime,
} from '@/shared/ui/datetime-picker';
import { toast } from 'sonner';

type ScheduleVideoCallDialogProps = {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScheduleVideoCallDialog({
  roomId,
  open,
  onOpenChange,
}: ScheduleVideoCallDialogProps) {
  const createCallMutation = useCreateVideoCallMutation(roomId);
  const [scheduledFor, setScheduledFor] = useState<Date>(
    () => getDefaultScheduleDateTime(),
  );

  const handleSubmit = async () => {
    if (!scheduledFor || scheduledFor.getTime() <= Date.now()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    await createCallMutation.mutateAsync({
      scheduledFor: scheduledFor.toISOString(),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule video call</DialogTitle>
          <DialogDescription>
            Pick a date and time for this live chat room.
          </DialogDescription>
        </DialogHeader>

        <DateTimePicker
          id="video-call-scheduled-for"
          value={scheduledFor}
          onChange={date => setScheduledFor(date ?? getDefaultScheduleDateTime())}
          minDate={new Date()}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-brand-orange hover:bg-brand-orange/90"
            isLoading={createCallMutation.isPending}
            onClick={() => void handleSubmit()}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
