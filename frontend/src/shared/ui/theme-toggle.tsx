import { useThemeSync } from '@/hooks/useThemeSync';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  type ThemePreference,
  fetchCurrentUser,
} from '@/features/profile/api/profile.api';
import { useQuery } from '@tanstack/react-query';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

const OPTIONS: {
  value: string;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const accessToken = useAuthSessionStore(s => s.accessToken);

  const { data: user } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchCurrentUser,
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const themePreference: ThemePreference | undefined = user?.themePreference;
  const { theme, setTheme } = useThemeSync(themePreference);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'bg-background/20 h-9 w-9 shrink-0 rounded-sm',
          className,
        )}
        aria-hidden
      />
    );
  }

  const ActiveIcon =
    OPTIONS.find(o => o.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'text-foreground bg-background/10 hover:bg-background/20 h-9 w-9 shrink-0',
            className,
          )}
          aria-label="Theme"
        >
          <ActiveIcon className="h-5 w-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-popover text-popover-foreground min-w-[8.5rem]"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            className={cn(
              'cursor-pointer gap-2',
              theme === value && 'bg-accent text-accent-foreground',
            )}
            onClick={() => setTheme(value)}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
