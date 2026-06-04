import { pageTitleClass } from '@/features/ideas/lib/styles';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';
import { Switch } from '@/shared/ui';
import {
  useNotificationStore,
  type NotificationKey,
} from '../model/notification-store';

type NotificationItem = {
  key: NotificationKey;
  title: string;
  description?: string;
};

const NOTIFICATION_ITEMS: NotificationItem[] = [
  { key: 'newSimilarIdeas', title: 'New similar ideas' },
  { key: 'newSimilarProblems', title: 'New similar problems' },
  { key: 'statusChange', title: 'Status change' },
  { key: 'newSupporters', title: 'New supporters' },
  { key: 'newComments', title: 'New comments' },
  {
    key: 'assignedIdeasAndProblems',
    title: 'Assigned ideas and problems',
    description: 'Projects assigned to you by your administrator',
  },
  {
    key: 'followUps',
    title: 'Follow-ups',
    description:
      'Sending friendly reminders to revisit your inactive ideas, problems and drafts',
  },
];

const actionButtonClassName =
  'text-xs font-semibold tracking-wider uppercase transition-colors sm:text-sm';

type ChannelToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

function ChannelToggle({ checked, onChange, label }: ChannelToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-900 sm:gap-3">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="leading-tight">{label}</span>
    </label>
  );
}

export function SettingsNotificationsPanel() {
  const channels = useNotificationStore(s => s.channels);
  const setAll = useNotificationStore(s => s.setAll);
  const setOneChannel = useNotificationStore(s => s.setOneChannel);

  const isAllEnabled = useMemo(
    () =>
      Object.values(channels).every(channel => channel.inApp && channel.email),
    [channels],
  );

  const isAllDisabled = useMemo(
    () =>
      Object.values(channels).every(
        channel => !channel.inApp && !channel.email,
      ),
    [channels],
  );

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-72px)]">
      <section className="bg-card mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
        <h1 className={cn(pageTitleClass, 'text-3xl sm:text-4xl')}>Settings</h1>

        <div className="mt-7 sm:mt-9 lg:mt-11">
          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:gap-12">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Notifications
            </h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button
                className={cn(
                  actionButtonClassName,
                  isAllEnabled
                    ? 'cursor-not-allowed text-slate-300'
                    : 'text-brand-dark-blue hover:text-brand-dark-blue/80 cursor-pointer',
                )}
                onClick={() => setAll(true)}
                disabled={isAllEnabled}
                type="button"
              >
                Enable all
              </button>
              <button
                className={cn(
                  actionButtonClassName,
                  isAllDisabled
                    ? 'cursor-not-allowed text-slate-300'
                    : 'text-brand-dark-blue hover:text-brand-dark-blue/80 cursor-pointer',
                )}
                onClick={() => setAll(false)}
                disabled={isAllDisabled}
                type="button"
              >
                Disable all
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-7">
            {NOTIFICATION_ITEMS.map(item => (
              <div className="space-y-2" key={item.key}>
                <div>
                  <h3 className="text-brand-black text-lg leading-tight font-semibold">
                    {item.title}
                  </h3>
                  {item.description ? (
                    <p className="mt-1 max-w-[760px] text-xs leading-5 text-slate-500 sm:text-sm">
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10 sm:gap-y-3">
                  <ChannelToggle
                    checked={channels[item.key].inApp}
                    label="In-App Notifications"
                    onChange={value => setOneChannel(item.key, 'inApp', value)}
                  />
                  <ChannelToggle
                    checked={channels[item.key].email}
                    label="Email Notifications"
                    onChange={value => setOneChannel(item.key, 'email', value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
