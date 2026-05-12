import { createFileRoute, redirect } from "@tanstack/react-router";
import { hasStoredAuthToken } from "@/shared/lib/auth-token";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    if (!hasStoredAuthToken()) {
      throw redirect({ to: "/login" });
    }
  },
});

