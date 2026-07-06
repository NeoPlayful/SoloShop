import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, search, status],
    queryFn: () => apiClient.get("/admin/products", { params: { page, pageSize: 20, search, status } }).then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "publish" | "unpublish" }) => apiClient.post(`/admin/products/${id}/${action}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("操作成功"); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/products/${id}/duplicate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("已复制"); },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">商品管理</h1>
        <button onClick={() => navigate("/admin/products/new")} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">新增商品</button>
      </div>

      <div className="mb-4 flex gap-2">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="搜索商品名称..." className="rounded border px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded border px-3 py-2 text-sm">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="active">已上架</option>
          <option value="inactive">已下架</option>
        </select>
      </div>

      <table className="w-full rounded-lg bg-white shadow">
        <thead className="border-b bg-gray-50"><tr>
          <th className="px-4 py-3 text-left text-sm">ID</th>
          <th className="px-4 py-3 text-left text-sm">名称</th>
          <th className="px-4 py-3 text-left text-sm">分类</th>
          <th className="px-4 py-3 text-left text-sm">价格</th>
          <th className="px-4 py-3 text-left text-sm">销量</th>
          <th className="px-4 py-3 text-left text-sm">状态</th>
          <th className="px-4 py-3 text-left text-sm">操作</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{item.id}</td>
              <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
              <td className="px-4 py-3 text-sm">{item.category?.name || "-"}</td>
              <td className="px-4 py-3 text-sm">¥{item.price}</td>
              <td className="px-4 py-3 text-sm">{item.salesCount}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.status === "active" ? "bg-green-100 text-green-700" : item.status === "draft" ? "bg-gray-100 text-gray-500" : "bg-yellow-100 text-yellow-700"}`}>{item.status}</span></td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => navigate(`/admin/products/${item.id}`)} className="mr-2 text-blue-500 hover:text-blue-700">编辑</button>
                {item.status !== "active" ? (
                  <button onClick={() => toggleMutation.mutate({ id: item.id, action: "publish" })} className="mr-2 text-green-500 hover:text-green-700">上架</button>
                ) : (
                  <button onClick={() => toggleMutation.mutate({ id: item.id, action: "unpublish" })} className="mr-2 text-yellow-500 hover:text-yellow-700">下架</button>
                )}
                <button onClick={() => duplicateMutation.mutate(item.id)} className="text-gray-500 hover:text-gray-700">复制</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
    </div>
  );
}
