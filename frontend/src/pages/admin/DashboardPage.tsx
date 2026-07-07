import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";

function StatCard({ label, value, unit = "" }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-lg bg-surface p-6 shadow">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}{unit}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation("admin");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiClient.get("/admin/dashboard/overview").then((r) => r.data.data),
  });

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("dashboardTitle")}</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t("todayOrders")} value={data?.todayOrders || 0} />
        <StatCard label={t("todaySales")} value={data?.todaySales || 0} unit={t("unitYuan")} />
        <StatCard label={t("pendingPayment")} value={data?.pendingPayment || 0} />
        <StatCard label={t("pendingDeliveries")} value={data?.pendingDeliveries || 0} />
        <StatCard label={t("productCount")} value={data?.productCount || 0} />
        <StatCard label={t("availableCards")} value={data?.lowStock || 0} />
      </div>
    </div>
  );
}
