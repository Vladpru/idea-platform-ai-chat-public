import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AppProviders } from "@/app/providers/AppProviders";
import { router } from "@/app/router";
import { hasStoredAuthToken } from "@/shared/lib/auth-token";
import { useAuthSessionStore } from "@/features/auth/model/auth-session-store";
import "@/app/styles/index.css";

useAuthSessionStore.persist.onFinishHydration(() => {
  if (!hasStoredAuthToken()) {
    useAuthSessionStore.getState().clearSession();
  }
});

function getIsAuthenticated(): boolean {
  return Boolean(localStorage.getItem("auth_token"));
}

const rootElement = document.getElementById("root")!;
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
