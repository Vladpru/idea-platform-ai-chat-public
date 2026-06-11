import { ROUTES } from '@/shared/config/paths';
import { useMatchRoute, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

export function useSearchNavigation() {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const isSearchActive = !!matchRoute({ to: ROUTES.search });

  const openSearch = useCallback(() => {
    navigate({
      to: ROUTES.search,
      search: { q: '', t: 'ideas' },
    });
  }, [navigate]);

  const dismissSearch = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate({
      to: ROUTES.home,
    });
  }, [navigate]);

  const toggleSearch = useCallback(() => {
    if (isSearchActive) {
      dismissSearch();
      return;
    }

    openSearch();
  }, [isSearchActive, dismissSearch, openSearch]);

  return {
    isSearchActive,
    openSearch,
    dismissSearch,
    toggleSearch,
  };
}
