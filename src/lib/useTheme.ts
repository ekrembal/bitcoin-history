import { useState, useEffect, useCallback, createContext, useContext } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContext {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeCtx = createContext<ThemeContext>({
  theme: "system",
  resolved: "dark",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export { ThemeCtx };

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function useThemeProvider() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("btc-history-theme") as Theme) || "system";
  });

  const [resolved, setResolved] = useState<"light" | "dark">(() => resolveTheme(theme));

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("btc-history-theme", newTheme);
    const r = resolveTheme(newTheme);
    setResolved(r);
    applyTheme(r);
  }, []);

  useEffect(() => {
    const r = resolveTheme(theme);
    setResolved(r);
    applyTheme(r);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const r = resolveTheme("system");
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return { theme, resolved, setTheme };
}
