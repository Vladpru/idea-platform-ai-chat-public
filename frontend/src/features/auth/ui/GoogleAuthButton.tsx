import { useState } from "react";
import { initiateGoogleLogin } from "../api/google-auth";
import { Button } from "@/shared/ui";
import { GoogleIcon } from "@/shared/ui/icons";

interface Props {
  mode: "signin" | "signup";
}

export function GoogleLoginButton({ mode }: Props) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = () => {
    setIsRedirecting(true);
    initiateGoogleLogin();
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full border-primary text-primary"
      isLoading={isRedirecting}
      onClick={handleLogin}
    >
      <GoogleIcon className="h-4 w-4" />
      {mode === "signin" ? "SIGN IN WITH GOOGLE" : "SIGN UP WITH GOOGLE"}
    </Button>
  );
}
