import { createFileRoute, redirect } from "@tanstack/react-router";
import { hasStoredAuthToken } from "@/shared/lib/auth-token";
import { Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/widgets/header";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    if (!hasStoredAuthToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <>
      <AppHeader />
      <Outlet />
    </>
  ),
});
