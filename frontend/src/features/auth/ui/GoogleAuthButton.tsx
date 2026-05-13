import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { loginWithGoogleAccessToken } from "../api/auth";
import { requestGoogleAccessToken } from "../api/google-auth";
import { Button } from "@/shared/ui";
import { GoogleIcon } from "@/shared/ui/icons";

interface Props {
  mode: "signin" | "signup";
}

export function GoogleLoginButton({ mode }: Props) {
  const navigate = useNavigate();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setIsBusy(true);
    try {
      const googleToken = await requestGoogleAccessToken();
      await loginWithGoogleAccessToken(googleToken);
      await navigate({ to: "/", replace: true });
    } catch (e) {
      setError((e as Error)?.message ?? "Google sign-in failed");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full border-primary text-primary"
        isLoading={isBusy}
        onClick={() => void handleLogin()}
      >
        <GoogleIcon className="h-4 w-4" />
        {mode === "signin" ? "SIGN IN WITH GOOGLE" : "SIGN UP WITH GOOGLE"}
      </Button>
      {error && (
        <p className="text-destructive text-center text-xs font-medium">{error}</p>
      )}
    </div>
  );
}
