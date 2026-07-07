import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { useTheme, themeRegistry } from "../../theme/index.js";
import toast from "react-hot-toast";

type ThemeMode = "light" | "dark" | "system";

export default function SettingsPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const { themeId: currentThemeId, mode: currentMode } = useTheme();

  const [selectedTheme, setSelectedTheme] = useState(currentThemeId);
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(currentMode);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiClient.get("/admin/settings").then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: { theme_id?: string; theme_mode?: ThemeMode }) =>
      apiClient.patch("/admin/settings/site", body),
    onSuccess: () => {
      toast.success(t("themeSaved"));
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      theme_id: selectedTheme,
      theme_mode: selectedMode,
    });
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("systemSettings")}</h1>

      {/* ─── 站点主题设置 ─── */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{t("themeSettings")}</h2>

        {/* 色系选择 */}
        <label className="mb-2 block text-sm font-medium text-text-primary">{t("siteDefaultTheme")}</label>
        <div className="mb-4 flex flex-wrap gap-3">
          {themeRegistry.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`w-36 rounded-lg border-2 p-3 text-left transition-colors ${
                selectedTheme === theme.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-border hover:border-blue-300"
              }`}
            >
              {/* 色块预览 */}
              <div className="mb-2 flex h-12 overflow-hidden rounded-md">
                <div
                  className="flex-1"
                  style={{ backgroundColor: theme.previewColors.light }}
                />
                <div
                  className="flex-1"
                  style={{ backgroundColor: theme.previewColors.dark }}
                />
              </div>
              <span className="text-sm font-medium text-text-primary">
                {tc(theme.labelKey as any)}
              </span>
            </button>
          ))}
        </div>

        {/* 亮暗模式选择 */}
        <label className="mb-2 block text-sm font-medium text-text-primary">{t("themeModeLabel")}</label>
        <div className="mb-4 flex gap-2">
          {(["light", "dark", "system"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`rounded border px-4 py-2 text-sm transition-colors ${
                selectedMode === mode
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-border text-text-primary hover:bg-surface-hover"
              }`}
            >
              {t(mode === "light" ? "themeLight" : mode === "dark" ? "themeDark" : "themeSystem")}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {saveMutation.isPending ? t("common:saving") : t("saveThemeSettings")}
        </button>
      </div>

      {/* ─── 现有系统设置列表 ─── */}
      <div className="space-y-3 rounded-lg bg-surface p-6 shadow">
        {data && Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <p className="text-sm font-medium text-text-primary">{key}</p>
              <p className="text-sm text-text-secondary">{String(value)}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(data?.[key] || "");
                toast.success(t("common:copied"));
              }}
              className="rounded border border-border px-3 py-1 text-xs text-text-primary hover:bg-surface-hover"
            >
              {t("common:copy")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
