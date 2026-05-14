import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { AppProviders } from '@/app/providers/AppProviders';
import { router } from '@/app/router';
import '@/app/styles/index.css';

import { hasStoredAuthToken } from '@/shared/lib/auth-token';

useAuthSessionStore.persist.onFinishHydration(() => {
  if (!hasStoredAuthToken()) {
    useAuthSessionStore.getState().clearSession();
  }
});

function getIsAuthenticated(): boolean {
  return Boolean(localStorage.getItem('auth_token'));
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <AppProviders>
        <RouterProvider
          router={router}
          context={{ isAuthenticated: getIsAuthenticated() }}
        />
      </AppProviders>
    </StrictMode>,
  );
}
