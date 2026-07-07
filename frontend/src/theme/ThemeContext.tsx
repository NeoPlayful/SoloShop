import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { themeRegistry, type ThemeConfig } from "./registry.js";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  /** 当前选中的色系 ID，如 "default-theme" */
  themeId: string;
  /** 当前亮暗模式偏好 */
  mode: ThemeMode;
  /** 实际渲染的亮暗（跟随系统解析后） */
  resolved: "light" | "dark";
  /** 切换色系 */
  setTheme: (id: string) => void;
  /** 切换亮暗模式 */
  setMode: (mode: ThemeMode) => void;
  /** 在当前色系内切换亮/暗 */
  toggle: () => void;
  /** 所有可用的色系 */
  availableThemes: ThemeConfig[];
  /** 当前色系的配置 */
  currentTheme: ThemeConfig | undefined;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_ID_KEY = "soloshop-theme-id";
const MODE_KEY = "soloshop-theme-mode";

function getStoredThemeId(): string {
  try {
    return localStorage.getItem(THEME_ID_KEY) || "default-theme";
  } catch {
    return "default-theme";
  }
}

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {}
  return "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(themeId: string, resolved: "light" | "dark") {
  const root = document.documentElement;
  root.setAttribute("data-theme", themeId);
  root.setAttribute("data-mode", resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(getStoredThemeId);
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    const m = getStoredMode();
    return m === "system" ? getSystemTheme() : m;
  });

  const setTheme = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(THEME_ID_KEY, id);
    } catch {}
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(MODE_KEY, newMode);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark");
  }, [resolved, setMode]);

  // Apply theme whenever themeId or resolved changes
  useEffect(() => {
    applyTheme(themeId, resolved);
  }, [themeId, resolved]);

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

  const currentTheme = themeRegistry.find((t) => t.id === themeId);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        mode,
        resolved,
        setTheme,
        setMode,
        toggle,
        availableThemes: themeRegistry,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
