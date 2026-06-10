import { pageTitleClass } from '@/features/ideas/lib/styles';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  useCurrentUserQuery,
  useUpdateNotificationPreferences,
} from '@/features/settings/hooks/use-notification-preferences';
import {
  buildAllChannelsPatch,
  type NotificationPreferenceKey,
} from '@/features/settings/model/notification-preferences.types';
import type { SettingsTab } from '@/features/settings/lib/settings-tab';
import { SettingsAccountSection } from '@/features/settings/ui/SettingsAccountSection';
import { useThemeSync } from '@/hooks/useThemeSync';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { cn } from '@/shared/lib/utils';
import { Switch } from '@/shared/ui';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useNavigate, useSearch } from '@tanstack/react-router';

type NotificationItem = {
  key: NotificationPreferenceKey;
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
  {
    key: 'directMessages',
    title: 'Direct messages',
    description: 'When someone sends you a private live chat message',
  },
];

const SETTINGS_NAV_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notifications' },
];

const actionButtonClassName =
  'text-xs font-semibold tracking-wider uppercase transition-colors sm:text-sm';

type ChannelToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

function ChannelToggle({
  checked,
  onChange,
  label,
  disabled,
}: ChannelToggleProps) {
  return (
    <label className="text-foreground inline-flex cursor-pointer items-center gap-2 text-sm sm:gap-3">
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <span className="leading-tight select-none">{label}</span>
    </label>
  );
}

function SettingsAppearanceSection() {
  const accessToken = useAuthSessionStore(s => s.accessToken);

  const { data: user } = useCurrentUserQuery({
    enabled: Boolean(accessToken),
  });

  const { theme, setTheme } = useThemeSync(user?.themePreference);

  const handleThemeClick = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
  };

  return (
    <section>
      <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
        Appearance
      </h2>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
        Choose how the app looks on this device. Synced to your account.
      </p>

      <div className="mt-6">
        <Tabs
          value={String(theme || 'light').toLowerCase()}
          onValueChange={handleThemeClick}
          className="w-full max-w-sm"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="light"
              className="flex items-center justify-center gap-2"
            >
              <Sun className="size-4 shrink-0" />
              <span>Light</span>
            </TabsTrigger>
            <TabsTrigger
              value="dark"
              className="flex items-center justify-center gap-2"
            >
              <Moon className="size-4 shrink-0" />
              <span>Dark</span>
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="flex items-center justify-center gap-2"
            >
              <Monitor className="size-4 shrink-0" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}

function SettingsNotificationsSection() {
  const accessToken = useAuthSessionStore(s => s.accessToken);
  const { data: user, isLoading } = useCurrentUserQuery({
    enabled: Boolean(accessToken),
  });
  const updatePreferences = useUpdateNotificationPreferences();
  const channels = user?.notificationPreferences;

  const isAllEnabled = useMemo(
    () =>
      channels
        ? Object.values(channels).every(
            channel => channel.inApp && channel.email,
          )
        : false,
    [channels],
  );

  const isAllDisabled = useMemo(
    () =>
      channels
        ? Object.values(channels).every(
            channel => !channel.inApp && !channel.email,
          )
        : false,
    [channels],
  );

  const handleSetAll = (value: boolean) => {
    updatePreferences.mutate(buildAllChannelsPatch(value));
  };

  const handleSetOneChannel = (
    key: NotificationPreferenceKey,
    channel: 'inApp' | 'email',
    value: boolean,
  ) => {
    updatePreferences.mutate({
      [key]: { [channel]: value },
    });
  };

  return (
    <section>
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:gap-12">
        <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
          Notifications
        </h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button
            className={cn(
              actionButtonClassName,
              isAllEnabled || isLoading
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'text-primary hover:text-primary/80 cursor-pointer',
            )}
            onClick={() => handleSetAll(true)}
            disabled={isAllEnabled || isLoading || updatePreferences.isPending}
            type="button"
          >
            Enable all
          </button>
          <button
            className={cn(
              actionButtonClassName,
              isAllDisabled || isLoading
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'text-primary hover:text-primary/80 cursor-pointer',
            )}
            onClick={() => handleSetAll(false)}
            disabled={isAllDisabled || isLoading || updatePreferences.isPending}
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
              <h3 className="text-foreground text-lg leading-tight font-semibold">
                {item.title}
              </h3>
              {item.description ? (
                <p className="text-muted-foreground mt-1 max-w-[760px] text-xs leading-5 sm:text-sm">
                  {item.description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10 sm:gap-y-3">
              <ChannelToggle
                checked={channels?.[item.key]?.inApp ?? true}
                label="In-App Notifications"
                disabled={isLoading || !channels}
                onChange={value =>
                  handleSetOneChannel(item.key, 'inApp', value)
                }
              />
              <ChannelToggle
                checked={channels?.[item.key]?.email ?? true}
                label="Email Notifications"
                disabled={isLoading || !channels}
                onChange={value =>
                  handleSetOneChannel(item.key, 'email', value)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SettingsPanel() {
  const navigate = useNavigate();
  const { tab } = useSearch({ from: '/_auth/settings' });

  const handleTabChange = useCallback(
    (nextTab: SettingsTab) => {
      void navigate({
        to: '/settings',
        search: { tab: nextTab },
      });
    },
    [navigate],
  );

  return (
    <main className="bg-brand-neutral dark:bg-background min-h-[calc(100vh-72px)]">
      <section className="bg-card text-card-foreground mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
        <h1
          className={cn(pageTitleClass, 'text-foreground text-3xl sm:text-4xl')}
        >
          Settings
        </h1>

        <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
          {SETTINGS_NAV_TABS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabChange(item.id)}
              className={cn(
                'cursor-pointer rounded-sm px-4 py-2 text-sm font-bold tracking-wide uppercase transition-colors',
                tab === item.id
                  ? 'bg-brand-dark-blue text-brand-white'
                  : 'text-brand-dark-blue hover:bg-brand-dark-blue/10 border-brand-dark-blue border bg-transparent',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-7 sm:mt-9 lg:mt-11">
          {tab === 'account' ? <SettingsAccountSection /> : null}
          {tab === 'appearance' ? <SettingsAppearanceSection /> : null}
          {tab === 'notifications' ? <SettingsNotificationsSection /> : null}
        </div>
      </section>
    </main>
  );
}
