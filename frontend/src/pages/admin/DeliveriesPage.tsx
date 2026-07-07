import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { useState } from "react";

export default function DeliveriesPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-deliveries", page, status],
    queryFn: () => apiClient.get("/admin/deliveries", { params: { page, pageSize: 20, status } }).then((r) => r.data.data),
  });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("deliveryManagement")}</h1>
      <div className="mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded border border-border px-3 py-2 text-sm text-text-primary">
          <option value="">{t("common:all")}</option>
          <option value="pending">{t("common:pending")}</option>
          <option value="delivered">{t("common:delivered")}</option>
          <option value="failed">{t("common:failed")}</option>
        </select>
      </div>
      <table className="w-full rounded-lg bg-surface shadow">
        <thead className="border-b border-border bg-surface-alt"><tr>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("id", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:orderNo")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("deliveryType")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:status")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:retry")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:createdAt")}</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
              <td className="px-4 py-3 text-sm text-text-primary">{item.id}</td>
              <td className="px-4 py-3 text-sm font-mono text-text-primary">{item.order?.orderNo || "-"}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.type}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.status === "delivered" ? "bg-green-100 text-green-700" : item.status === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{item.status === "delivered" ? t("common:delivered") : item.status === "failed" ? t("common:failed") : t("common:pending")}</span></td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.retryCount}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{item.createdAt?.substring(0, 16) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
    </div>
  );
}
