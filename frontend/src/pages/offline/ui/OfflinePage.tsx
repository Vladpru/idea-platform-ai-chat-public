import { hasValidSession } from '@/features/auth/model/auth-session-store';
import { sectionTitleClass } from '@/features/profile/ui/shared/profile-view-classes';
import { cn } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/card';
import { AppHeader } from '@/widgets/header';
import { WifiOff } from 'lucide-react';

function OfflineContent() {
  return (
    <div className="bg-brand-gray-100 dark:bg-background flex flex-1 items-center justify-center py-8 md:min-w-4xl md:px-8">
      <Card
        className={cn(
          'bg-card mx-auto w-full border-0 px-6 py-12 text-center shadow-none',
          'flex flex-col items-center justify-center md:h-[400px] md:max-w-[1680px]',
          'dark:bg-card bg-brand-white md:px-16 md:py-16',
        )}
      >
        <WifiOff
          className="text-brand-gray-600 dark:text-brand-gray-400 mb-6 size-10"
          aria-hidden
        />
        <h1 className={cn(sectionTitleClass, 'text-xl md:text-2xl')}>
          No internet connection
        </h1>
        <p className="dark:text-brand-gray-600 mx-auto mt-4 max-w-lg text-sm leading-relaxed md:text-base">
          Please connect to the internet to view this content.
        </p>
      </Card>
    </div>
  );
}

export function OfflinePage() {
  const isAuthed = hasValidSession();

  return (
    <div className="flex min-h-svh flex-col">
      {isAuthed && <AppHeader />}
      <OfflineContent />
    </div>
  );
}
