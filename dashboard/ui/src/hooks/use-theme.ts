import { useEffect, useMemo, useState } from "react";

export type DashboardTheme = "light" | "dark";

const THEME_STORAGE_KEY = "nexis_dashboard_theme_v1";

function readInitialTheme(): DashboardTheme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // noop
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: DashboardTheme): void {
  const root = window.document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<DashboardTheme>(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // noop
    }
  }, [theme]);

  const toggleTheme = useMemo(
    () => () => {
      setTheme((current) => (current === "dark" ? "light" : "dark"));
    },
    [],
  );

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
