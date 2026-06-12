import { inviteConferenceSpeaker } from '@/features/idea-conference/api/idea-conference.api';
import type { SuggestedSpeakerDto } from '@/features/idea-conference/api/idea-conference-api.types';
import { useScheduleConferenceMutation } from '@/features/idea-conference/hooks/mutations/use-schedule-conference-mutation';
import { useSuggestedSpeakersQuery } from '@/features/idea-conference/hooks/queries/use-suggested-speakers-query';
import { ideaConferenceQueryKeys } from '@/features/idea-conference/lib/idea-conference-query-keys';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DateTimePicker,
  getDefaultScheduleDateTime,
} from '@/shared/ui/datetime-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  UserInviteCard,
  type UserInviteCardState,
} from '@/shared/ui/user-invite-card/UserInviteCard';
import { toast } from 'sonner';

type ScheduleIdeaConferenceDialogProps = {
  ideaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapSpeakerCardState(
  speaker: SuggestedSpeakerDto,
  selectedSpeakerIds: Set<string>,
  isSubmitting: boolean,
): UserInviteCardState {
  if (speaker.roleLabel === 'Author' || speaker.inviteState === 'accepted') {
    return 'disabled';
  }

  if (speaker.inviteState === 'invited') {
    return 'invited';
  }

  if (isSubmitting && selectedSpeakerIds.has(speaker.userId)) {
    return 'loading';
  }

  if (selectedSpeakerIds.has(speaker.userId)) {
    return 'invited';
  }

  return 'idle';
}

export function ScheduleIdeaConferenceDialog({
  ideaId,
  open,
  onOpenChange,
}: ScheduleIdeaConferenceDialogProps) {
  const queryClient = useQueryClient();
  const scheduleMutation = useScheduleConferenceMutation(ideaId);
  const { data: suggestedSpeakers, isLoading: isSuggestedSpeakersLoading } =
    useSuggestedSpeakersQuery(ideaId, { enabled: open });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(() =>
    getDefaultScheduleDateTime(),
  );
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [externalEmail, setExternalEmail] = useState('');
  const [externalEmails, setExternalEmails] = useState<string[]>([]);
  const [prevOpen, setPrevOpen] = useState(open);

  const speakers = suggestedSpeakers?.speakers ?? [];
  const isSubmitting = scheduleMutation.isPending;

  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setTitle('');
      setDescription('');
      setScheduledFor(getDefaultScheduleDateTime());
      setSelectedSpeakerIds(new Set());
      setExternalEmail('');
      setExternalEmails([]);
    }
  }

  const toggleSpeakerSelection = (userId: string) => {
    setSelectedSpeakerIds(previous => {
      const next = new Set(previous);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleAddExternalEmail = () => {
    const normalizedEmail = externalEmail.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    if (externalEmails.includes(normalizedEmail)) {
      toast.error('Email already added');
      return;
    }

    setExternalEmails(previous => [...previous, normalizedEmail]);
    setExternalEmail('');
  };

  const handleRemoveExternalEmail = (email: string) => {
    setExternalEmails(previous => previous.filter(item => item !== email));
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error('Title is required');
      return;
    }

    if (!scheduledFor || Number.isNaN(scheduledFor.getTime())) {
      toast.error('Select a valid date and time');
      return;
    }

    if (scheduledFor.getTime() <= Date.now()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    try {
      const conference = await scheduleMutation.mutateAsync({
        title: trimmedTitle,
        description: description.trim() || undefined,
        scheduledFor: scheduledFor.toISOString(),
        speakerUserIds:
          selectedSpeakerIds.size > 0
            ? Array.from(selectedSpeakerIds)
            : undefined,
      });

      for (const email of externalEmails) {
        await inviteConferenceSpeaker(ideaId, conference.id, { email });
      }

      if (externalEmails.length > 0) {
        await queryClient.invalidateQueries({
          queryKey: ideaConferenceQueryKeys.suggestedSpeakers(ideaId),
        });
        toast.success('External speaker invites sent');
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule conference</DialogTitle>
          <DialogDescription>
            Plan a public webinar for this idea and invite speakers from your
            team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="conference-title">Title</Label>
            <Input
              id="conference-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Product roadmap Q&A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conference-description">Description</Label>
            <Input
              id="conference-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Optional details for your audience"
            />
          </div>

          <DateTimePicker
            id="conference-scheduled-for"
            value={scheduledFor}
            onChange={setScheduledFor}
            minDate={minDate}
          />

          <div className="space-y-3">
            <div>
              <h3 className="text-brand-dark-blue text-sm font-semibold">
                Suggested contributors
              </h3>
              <p className="text-brand-gray-500 text-sm">
                Invite team members to speak during the conference.
              </p>
            </div>

            {isSuggestedSpeakersLoading ? (
              <p className="text-brand-gray-500 text-sm">Loading team...</p>
            ) : null}

            {!isSuggestedSpeakersLoading && speakers.length === 0 ? (
              <p className="text-brand-gray-500 text-sm">
                No suggested contributors found.
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {speakers.map(speaker => {
                const state = mapSpeakerCardState(
                  speaker,
                  selectedSpeakerIds,
                  isSubmitting,
                );
                const canToggle =
                  state === 'idle' || selectedSpeakerIds.has(speaker.userId);

                return (
                  <UserInviteCard
                    key={speaker.userId}
                    userId={speaker.userId}
                    name={speaker.name}
                    avatarUrl={speaker.avatarUrl}
                    roleLabel={speaker.roleLabel}
                    state={state}
                    onInvite={
                      canToggle
                        ? () => toggleSpeakerSelection(speaker.userId)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-brand-dark-blue text-sm font-semibold">
                External speaker
              </h3>
              <p className="text-brand-gray-500 text-sm">
                Add an email invite for someone outside the platform.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={externalEmail}
                onChange={event => setExternalEmail(event.target.value)}
                placeholder="speaker@example.com"
                type="email"
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddExternalEmail();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="sm:w-auto"
                onClick={handleAddExternalEmail}
              >
                Add email
              </Button>
            </div>

            {externalEmails.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {externalEmails.map(email => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => handleRemoveExternalEmail(email)}
                    className={cn(
                      'bg-brand-gray-100 text-brand-dark-blue hover:bg-brand-gray-200 rounded-full px-3 py-1 text-sm transition-colors',
                    )}
                  >
                    {email} ×
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-brand-orange hover:bg-brand-orange/90"
            isLoading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            Schedule conference
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
