import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"operation" | "login">("operation");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", tab, page],
    queryFn: () => apiClient.get(`/admin/logs/${tab}`, { params: { page, pageSize: 20 } }).then((r) => r.data.data),
  });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">操作日志</h1>
      <div className="mb-4 flex gap-2">
        <button onClick={() => { setTab("operation"); setPage(1); }} className={`rounded px-4 py-2 text-sm ${tab === "operation" ? "bg-blue-500 text-white" : "bg-gray-100"}`}>操作日志</button>
        <button onClick={() => { setTab("login"); setPage(1); }} className={`rounded px-4 py-2 text-sm ${tab === "login" ? "bg-blue-500 text-white" : "bg-gray-100"}`}>登录日志</button>
      </div>
      <table className="w-full rounded-lg bg-white shadow">
        <thead className="border-b bg-gray-50"><tr>
          <th className="px-4 py-3 text-left text-sm">操作</th>
          <th className="px-4 py-3 text-left text-sm">对象</th>
          <th className="px-4 py-3 text-left text-sm">管理员</th>
          <th className="px-4 py-3 text-left text-sm">时间</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b text-sm hover:bg-gray-50">
              <td className="px-4 py-3">{item.action}</td>
              <td className="px-4 py-3">{item.targetType}#{item.targetId}</td>
              <td className="px-4 py-3">{item.admin?.username || "-"}</td>
              <td className="px-4 py-3 text-gray-500">{item.createdAt?.substring(0, 16) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
    </div>
  );
}
