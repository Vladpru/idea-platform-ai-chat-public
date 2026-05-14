import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "@/shared/lib/theme-store";
import { Button } from "@/shared/ui";

function subscribeToSystemDark(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSystemDarkSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemDarkServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot,
  );

  const isDark =
    theme === "dark" || (theme === "system" && systemPrefersDark);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-50 size-10 rounded-full shadow-md"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
