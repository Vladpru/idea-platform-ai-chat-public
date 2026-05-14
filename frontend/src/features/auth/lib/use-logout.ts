import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

export function useLogout(): () => void {
  const navigate = useNavigate();

  return useCallback(() => {
    useAuthSessionStore.getState().clearSession();
    void navigate({ to: '/login', replace: true });
  }, [navigate]);
}
