import type { ConferenceDto } from '@/features/conference/api/conference-api.types';
import { formatConferenceScheduledFor } from '@/features/conference/lib/format-conference-time';
import { useConferenceCountdown } from '@/features/conference/lib/use-conference-countdown';

import { Button } from '@/shared/ui/button';

type ConferenceWaitingRoomProps = {
  conference: ConferenceDto;
  isAuthor: boolean;
  isStarting: boolean;
  onStartConference?: () => void;
};

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-brand-gray-100 flex min-w-[4.5rem] flex-col items-center rounded-lg px-3 py-4">
      <span className="text-brand-dark-blue text-2xl font-bold tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-brand-gray-500 text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

export function ConferenceWaitingRoom({
  conference,
  isAuthor,
  isStarting,
  onStartConference,
}: ConferenceWaitingRoomProps) {
  const countdown = useConferenceCountdown(conference.scheduledFor);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 py-10 text-center">
      <div className="space-y-3">
        <p className="text-brand-gray-600 text-xs font-semibold tracking-wide uppercase">
          Waiting room
        </p>
        <h1 className="text-brand-dark-blue text-3xl font-bold">
          {conference.title}
        </h1>
        {conference.description ? (
          <p className="text-brand-gray-600 text-base">
            {conference.description}
          </p>
        ) : null}
        <p className="text-brand-gray-500 text-sm">
          Scheduled for {formatConferenceScheduledFor(conference.scheduledFor)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <CountdownUnit label="Days" value={countdown.days} />
        <CountdownUnit label="Hours" value={countdown.hours} />
        <CountdownUnit label="Minutes" value={countdown.minutes} />
        <CountdownUnit label="Seconds" value={countdown.seconds} />
      </div>

      {countdown.isComplete ? (
        <p className="text-brand-orange text-sm font-medium">
          The scheduled start time has passed. The host can start the conference
          at any moment.
        </p>
      ) : null}

      {isAuthor ? (
        <Button
          type="button"
          className="bg-brand-orange hover:bg-brand-orange/90"
          isLoading={isStarting}
          onClick={onStartConference}
        >
          Start conference
        </Button>
      ) : (
        <p className="text-brand-gray-500 max-w-md text-sm">
          You will join automatically once the host starts the conference.
        </p>
      )}
    </div>
  );
}
