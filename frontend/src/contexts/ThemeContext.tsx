import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "soloshop-theme";

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {}
  return "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    const m = getStoredMode();
    return m === "system" ? getSystemTheme() : m;
  });

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark");
  }, [resolved, setMode]);

  // Apply theme whenever resolved changes
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  // Listen for system theme changes when mode is "system"
  useEffect(() => {
    if (mode !== "system") {
      setResolved(mode);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(getSystemTheme());
    mq.addEventListener("change", handler);
    handler();
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
