import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";

export default function LogsPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"operation" | "login">("operation");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", tab, page],
    queryFn: () => apiClient.get(`/admin/logs/${tab}`, { params: { page, pageSize: 20 } }).then((r) => r.data.data),
  });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("operationLogs")}</h1>
      <div className="mb-4 flex gap-2">
        <button onClick={() => { setTab("operation"); setPage(1); }} className={`rounded px-4 py-2 text-sm ${tab === "operation" ? "bg-blue-500 text-white" : "bg-surface-hover text-text-primary"}`}>{t("operationLogs")}</button>
        <button onClick={() => { setTab("login"); setPage(1); }} className={`rounded px-4 py-2 text-sm ${tab === "login" ? "bg-blue-500 text-white" : "bg-surface-hover text-text-primary"}`}>{t("common:login")}</button>
      </div>
      <table className="w-full rounded-lg bg-surface shadow">
        <thead className="border-b border-border bg-surface-alt"><tr>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("action")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("target")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("admin")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:createdAt")}</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b border-border text-sm hover:bg-surface-hover">
              <td className="px-4 py-3 text-text-primary">{item.action}</td>
              <td className="px-4 py-3 text-text-primary">{item.targetType}#{item.targetId}</td>
              <td className="px-4 py-3 text-text-primary">{item.admin?.username || "-"}</td>
              <td className="px-4 py-3 text-text-secondary">{item.createdAt?.substring(0, 16) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
    </div>
  );
}
