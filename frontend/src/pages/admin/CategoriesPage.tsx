import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Modal } from "../../components/Modal.js";
import { ConfirmDialog } from "../../components/ConfirmDialog.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Input } from "../../theme/components/form/Input.js";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories", page, pageSize],
    queryFn: () => apiClient.get("/admin/categories", { params: { page, pageSize } }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editId && editId > 0
      ? apiClient.patch(`/admin/categories/${editId}`, body)
      : apiClient.post("/admin/categories", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setEditId(null); setForm({ name: "", slug: "", description: "", sortOrder: 0 }); toast.success(t("saveSuccess", { ns: "common" })); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setDeleteId(null); toast.success(t("deleteSuccess", { ns: "common" })); },
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
        <h1 className="text-xl font-bold text-text-primary">{t("categoryManagement")}</h1>
        <button onClick={() => openEdit()} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">{t("addCategory")}</button>
      </div>

      <table className="w-full rounded-lg bg-surface shadow">
        <thead className="border-b border-border bg-surface-alt"><tr>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("id", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("categoryName")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("categorySlug")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("categorySort")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("productCount2")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("status", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("operation", { ns: "common" })}</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
              <td className="px-4 py-3 text-sm text-text-primary">{item.id}</td>
              <td className="px-4 py-3 text-sm font-medium text-text-primary">{item.name}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{item.slug}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.sortOrder}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item._count?.products || 0}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{item.isVisible ? t("visible") : t("hidden")}</span></td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => openEdit(item)} className="mr-2 text-blue-500 hover:text-blue-700">{t("edit", { ns: "common" })}</button>
                <button onClick={() => toggleMutation.mutate({ id: item.id, action: item.isVisible ? "disable" : "enable" })} className="mr-2 text-yellow-500 hover:text-yellow-700">{item.isVisible ? t("hidden") : t("visible")}</button>
                <button onClick={() => setDeleteId(item.id)} className="text-red-500 hover:text-red-700">{t("delete", { ns: "common" })}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={data?.total || 0}
        onChange={setPage}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      <Modal open={editId !== null} title={editId && editId > 0 ? t("editCategory") : t("addCategory")} onClose={() => { setEditId(null); setForm({ name: "", slug: "", description: "", sortOrder: 0 }); }}>
        <div className="space-y-4">
          <Input label={t("categoryName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label={t("categorySlug")} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input label={t("categoryDescription")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label={t("categorySort")} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
          <button onClick={() => saveMutation.mutate(form)} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600">{t("save", { ns: "common" })}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} message={t("deleteCategoryConfirm")} onConfirm={() => deleteMutation.mutate(deleteId!)} onCancel={() => setDeleteId(null)} danger />
    </div>
  );
}
