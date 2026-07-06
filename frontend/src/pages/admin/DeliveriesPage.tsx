import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { useState } from "react";

export default function DeliveriesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-deliveries", page, status],
    queryFn: () => apiClient.get("/admin/deliveries", { params: { page, pageSize: 20, status } }).then((r) => r.data.data),
  });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">发货管理</h1>
      <div className="mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded border px-3 py-2 text-sm">
          <option value="">全部</option>
          <option value="pending">待发货</option>
          <option value="delivered">已发货</option>
          <option value="failed">失败</option>
        </select>
      </div>
      <table className="w-full rounded-lg bg-white shadow">
        <thead className="border-b bg-gray-50"><tr>
          <th className="px-4 py-3 text-left text-sm">ID</th>
          <th className="px-4 py-3 text-left text-sm">订单号</th>
          <th className="px-4 py-3 text-left text-sm">类型</th>
          <th className="px-4 py-3 text-left text-sm">状态</th>
          <th className="px-4 py-3 text-left text-sm">重试</th>
          <th className="px-4 py-3 text-left text-sm">时间</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{item.id}</td>
              <td className="px-4 py-3 text-sm font-mono">{item.order?.orderNo || "-"}</td>
              <td className="px-4 py-3 text-sm">{item.type}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.status === "delivered" ? "bg-green-100 text-green-700" : item.status === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{item.status}</span></td>
              <td className="px-4 py-3 text-sm">{item.retryCount}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{item.createdAt?.substring(0, 16) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
    </div>
  );
}
