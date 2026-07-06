import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", page],
    queryFn: () => apiClient.get("/admin/payments", { params: { page, pageSize: 20 } }).then((r) => r.data.data),
  });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">支付记录</h1>
      <table className="w-full rounded-lg bg-white shadow">
        <thead className="border-b bg-gray-50"><tr>
          <th className="px-4 py-3 text-left text-sm">ID</th>
          <th className="px-4 py-3 text-left text-sm">订单</th>
          <th className="px-4 py-3 text-left text-sm">渠道</th>
          <th className="px-4 py-3 text-left text-sm">金额</th>
          <th className="px-4 py-3 text-left text-sm">状态</th>
          <th className="px-4 py-3 text-left text-sm">时间</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{item.id}</td>
              <td className="px-4 py-3 text-sm font-mono">{item.order?.orderNo || "-"}</td>
              <td className="px-4 py-3 text-sm">{item.channel}</td>
              <td className="px-4 py-3 text-sm">¥{item.amount}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.status === "success" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{item.status}</span></td>
              <td className="px-4 py-3 text-sm text-gray-500">{item.createdAt?.substring(0, 16) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
    </div>
  );
}
