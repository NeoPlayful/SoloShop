import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { t } = useTranslation("admin");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiClient.get("/admin/settings").then((r) => r.data.data),
  });

  if (isLoading) return <LoadingState />;

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(data?.[key] || "");
    toast.success(t("common:copied"));
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("systemSettings")}</h1>
      <div className="space-y-3 rounded-lg bg-surface p-6 shadow">
        {data && Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <p className="text-sm font-medium text-text-primary">{key}</p>
              <p className="text-sm text-text-secondary">{String(value)}</p>
            </div>
            <button onClick={() => handleCopy(key)} className="rounded border border-border px-3 py-1 text-xs text-text-primary hover:bg-surface-hover">{t("common:copy")}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
