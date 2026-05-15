import { APP_NAME } from '@/shared/config/constants';

export function HomePage() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">{APP_NAME}</h1>
      <p className="text-muted-foreground text-sm">
        Home
        <code className="bg-muted rounded px-1 py-0.5 text-xs">pages/</code>.
      </p>
    </div>
  );
}
