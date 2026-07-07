import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";

export default function PaymentsPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", page],
    queryFn: () => apiClient.get("/admin/payments", { params: { page, pageSize: 20 } }).then((r) => r.data.data),
  });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("paymentManagement")}</h1>
      <table className="w-full rounded-lg bg-surface shadow">
        <thead className="border-b border-border bg-surface-alt"><tr>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("id", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:orderNo")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("channel")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("paidAmount")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:status")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:createdAt")}</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
              <td className="px-4 py-3 text-sm text-text-primary">{item.id}</td>
              <td className="px-4 py-3 text-sm font-mono text-text-primary">{item.order?.orderNo || "-"}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.channel}</td>
              <td className="px-4 py-3 text-sm text-text-primary">¥{item.amount}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.status === "success" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{item.status === "success" ? t("common:success") : t("common:pending")}</span></td>
              <td className="px-4 py-3 text-sm text-text-secondary">{item.createdAt?.substring(0, 16) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
    </div>
  );
}
