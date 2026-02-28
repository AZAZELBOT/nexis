import { MoonStar, Sun } from "lucide-react";

import type { DashboardTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: DashboardTheme;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-8"
      onClick={onToggle}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
    >
      {theme === "dark" ? <Sun className="size-4" /> : <MoonStar className="size-4" />}
    </Button>
  );
}
