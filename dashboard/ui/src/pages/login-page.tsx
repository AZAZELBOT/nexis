import { GalleryVerticalEnd } from "lucide-react";

import type { DashboardTheme } from "@/hooks/use-theme";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginPage({
  onLogin,
  theme,
  onToggleTheme,
}: {
  onLogin: (email: string, password: string) => Promise<void> | void;
  theme: DashboardTheme;
  onToggleTheme: () => void;
}) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex justify-end">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <a
          href="#"
          className="text-foreground flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Nexis Operator
        </a>
        <LoginForm onLogin={onLogin} />
      </div>
    </div>
  );
}
