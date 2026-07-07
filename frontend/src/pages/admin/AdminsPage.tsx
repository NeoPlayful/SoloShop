import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";

export default function AdminsPage() {
  const { t } = useTranslation("admin");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: () => apiClient.get("/admin/admins").then((r) => r.data.data),
  });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("adminManagement")}</h1>
      <table className="w-full rounded-lg bg-surface shadow">
        <thead className="border-b border-border bg-surface-alt"><tr>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("id", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:username")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("nickname")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("superAdmin")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:status")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("lastLogin")}</th>
        </tr></thead>
        <tbody>
          {data?.map((item: any) => (
            <tr key={item.id} className="border-b border-border text-sm hover:bg-surface-hover">
              <td className="px-4 py-3 text-text-primary">{item.id}</td>
              <td className="px-4 py-3 font-medium text-text-primary">{item.username}</td>
              <td className="px-4 py-3 text-text-primary">{item.nickname || "-"}</td>
              <td className="px-4 py-3 text-text-primary">{item.isSuperAdmin ? t("common:yes") : t("common:no")}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.isActive ? t("common:enabled") : t("common:disabled")}</span></td>
              <td className="px-4 py-3 text-text-secondary">{item.lastLoginAt?.substring(0, 16) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
