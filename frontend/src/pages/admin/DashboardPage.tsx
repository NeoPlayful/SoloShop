import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { LoadingState } from "../../components/LoadingStates.js";

function StatCard({ label, value, unit = "" }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}{unit}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiClient.get("/admin/dashboard/overview").then((r) => r.data.data),
  });

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">仪表板</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="今日订单" value={data?.todayOrders || 0} />
        <StatCard label="今日销售额" value={data?.todaySales || 0} unit=" 元" />
        <StatCard label="待支付" value={data?.pendingPayment || 0} />
        <StatCard label="发货失败" value={data?.pendingDeliveries || 0} />
        <StatCard label="商品总数" value={data?.productCount || 0} />
        <StatCard label="可用卡密" value={data?.lowStock || 0} />
      </div>
    </div>
  );
}
