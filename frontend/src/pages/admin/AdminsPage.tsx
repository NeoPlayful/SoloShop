import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { LoadingState } from "../../components/LoadingStates.js";

export default function AdminsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: () => apiClient.get("/admin/admins").then((r) => r.data.data),
  });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">管理员管理</h1>
      <table className="w-full rounded-lg bg-white shadow">
        <thead className="border-b bg-gray-50"><tr>
          <th className="px-4 py-3 text-left text-sm">ID</th>
          <th className="px-4 py-3 text-left text-sm">用户名</th>
          <th className="px-4 py-3 text-left text-sm">昵称</th>
          <th className="px-4 py-3 text-left text-sm">超级管理员</th>
          <th className="px-4 py-3 text-left text-sm">状态</th>
          <th className="px-4 py-3 text-left text-sm">最后登录</th>
        </tr></thead>
        <tbody>
          {data?.map((item: any) => (
            <tr key={item.id} className="border-b text-sm hover:bg-gray-50">
              <td className="px-4 py-3">{item.id}</td>
              <td className="px-4 py-3 font-medium">{item.username}</td>
              <td className="px-4 py-3">{item.nickname || "-"}</td>
              <td className="px-4 py-3">{item.isSuperAdmin ? "是" : "否"}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.isActive ? "启用" : "禁用"}</span></td>
              <td className="px-4 py-3 text-gray-500">{item.lastLoginAt?.substring(0, 16) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
