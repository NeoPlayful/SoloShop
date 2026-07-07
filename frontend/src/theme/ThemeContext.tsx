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

function getStoredThemeIdRaw(): string | null {
  try {
    return localStorage.getItem(THEME_ID_KEY);
  } catch {
    return null;
  }
}

function getStoredModeRaw(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {}
  return null;
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
  const [themeId, setThemeIdState] = useState<string>(() => getStoredThemeIdRaw() || "default-theme");
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredModeRaw() || "system");
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    const m = getStoredModeRaw() || "system";
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

  // 方案B：localStorage 无值时，从服务器获取默认主题设置
  useEffect(() => {
    // 如果用户已有 localStorage 覆盖，不获取服务器默认值
    if (getStoredThemeIdRaw() && getStoredModeRaw()) return;

    fetch("/api/public/settings")
      .then((r) => r.json())
      .then((res) => {
        if (!res.success || !res.data) return;
        const serverThemeId: string = res.data.site_theme_id || "default-theme";
        const serverMode: ThemeMode = res.data.site_theme_mode || "system";
        setThemeIdState(serverThemeId);
        setModeState(serverMode);
      })
      .catch(() => {
        // 静默失败，保持硬编码默认值
      });
  }, []);

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
