import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { Modal } from "../../components/Modal.js";
import { ConfirmDialog } from "../../components/ConfirmDialog.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories", page],
    queryFn: () => apiClient.get("/admin/categories", { params: { page, pageSize: 20 } }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editId && editId > 0
      ? apiClient.patch(`/admin/categories/${editId}`, body)
      : apiClient.post("/admin/categories", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setEditId(null); setForm({ name: "", slug: "", description: "", sortOrder: 0 }); toast.success("保存成功"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setDeleteId(null); toast.success("删除成功"); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "enable" | "disable" }) => apiClient.post(`/admin/categories/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  const openEdit = (item?: any) => {
    if (item) { setEditId(item.id); setForm({ name: item.name, slug: item.slug, description: item.description || "", sortOrder: item.sortOrder }); }
    else { setEditId(-1); setForm({ name: "", slug: "", description: "", sortOrder: 0 }); }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">分类管理</h1>
        <button onClick={() => openEdit()} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">新增分类</button>
      </div>

      <table className="w-full rounded-lg bg-white shadow">
        <thead className="border-b bg-gray-50"><tr>
          <th className="px-4 py-3 text-left text-sm">ID</th>
          <th className="px-4 py-3 text-left text-sm">名称</th>
          <th className="px-4 py-3 text-left text-sm">Slug</th>
          <th className="px-4 py-3 text-left text-sm">排序</th>
          <th className="px-4 py-3 text-left text-sm">商品数</th>
          <th className="px-4 py-3 text-left text-sm">状态</th>
          <th className="px-4 py-3 text-left text-sm">操作</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{item.id}</td>
              <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{item.slug}</td>
              <td className="px-4 py-3 text-sm">{item.sortOrder}</td>
              <td className="px-4 py-3 text-sm">{item._count?.products || 0}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{item.isVisible ? "显示" : "隐藏"}</span></td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => openEdit(item)} className="mr-2 text-blue-500 hover:text-blue-700">编辑</button>
                <button onClick={() => toggleMutation.mutate({ id: item.id, action: item.isVisible ? "disable" : "enable" })} className="mr-2 text-yellow-500 hover:text-yellow-700">{item.isVisible ? "隐藏" : "显示"}</button>
                <button onClick={() => setDeleteId(item.id)} className="text-red-500 hover:text-red-700">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />

      <Modal open={editId !== null} title={editId ? "编辑分类" : "新增分类"} onClose={() => { setEditId(null); setForm({ name: "", slug: "", description: "", sortOrder: 0 }); }}>
        <div className="space-y-4">
          <div><label className="mb-1 block text-sm">名称</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border px-3 py-2" /></div>
          <div><label className="mb-1 block text-sm">Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded border px-3 py-2" /></div>
          <div><label className="mb-1 block text-sm">描述</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded border px-3 py-2" /></div>
          <div><label className="mb-1 block text-sm">排序</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full rounded border px-3 py-2" /></div>
          <button onClick={() => saveMutation.mutate(form)} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600">保存</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} message="确定删除此分类？如有商品则无法删除。" onConfirm={() => deleteMutation.mutate(deleteId!)} onCancel={() => setDeleteId(null)} danger />
    </div>
  );
}
