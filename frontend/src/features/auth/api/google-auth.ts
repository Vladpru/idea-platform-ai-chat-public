export function initiateGoogleLogin(): void {
  const base = import.meta.env.VITE_API_URL;
  if (typeof base !== "string" || base.length === 0) {
    throw new Error("VITE_API_URL is not set");
  }
  const origin = base.replace(/\/$/, "");
  window.location.assign(`${origin}/auth/google`);
}
