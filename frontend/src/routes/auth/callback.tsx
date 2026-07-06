import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

export const Route = createFileRoute('/auth/callback')({
  head: () => pageDocumentHead('Signing In'),
  component: AuthCallbackPage,
});

function readTokenFromSearch(): string | null {
  return new URLSearchParams(window.location.search).get('token');
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (readTokenFromSearch()) {
      void navigate({ to: '/profile', replace: true });
    } else {
      console.error('OAuth callback: missing token query parameter');
      void navigate({ to: '/login', replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      <p className="text-muted-foreground text-sm">Finishing auth...</p>
    </div>
  );
}
