import { createFileRoute, redirect } from "@tanstack/react-router";
import { RegisterPage } from "@/pages/register";
import { hasStoredAuthToken } from "@/shared/lib/auth-token";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    if (hasStoredAuthToken()) {
      throw redirect({ to: "/" });
    }
  },
  component: RegisterPage,
});
