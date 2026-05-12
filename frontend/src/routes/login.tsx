import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/pages/login";
import { hasStoredAuthToken } from "@/shared/lib/auth-token";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (hasStoredAuthToken()) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});
