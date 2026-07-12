import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Input } from "../../theme/components/form/Input.js";
import { Select } from "../../theme/components/form/Select.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const { t } = useTranslation("admin");
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success(t("operationSuccess", { ns: "common" })); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/products/${id}/duplicate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success(t("duplicate", { ns: "common" })); },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("productManagement")}</h1>
        <button onClick={() => navigate("/admin/products/new")} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">{t("addProduct")}</button>
      </div>

      <div className="mb-4 flex gap-2">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("searchProduct")} className="max-w-xs" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={[
          { value: "", label: t("allStatus") },
          { value: "draft", label: t("draft") },
          { value: "active", label: t("active") },
          { value: "inactive", label: t("inactive") },
        ]} />
      </div>

      <table className="w-full rounded-lg bg-surface shadow">
        <thead className="border-b border-border bg-surface-alt"><tr>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("id", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("name", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("category")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("price")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("stock")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("salesCount")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("status", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("operation", { ns: "common" })}</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
              <td className="px-4 py-3 text-sm text-text-primary">{item.id}</td>
              <td className="px-4 py-3 text-sm font-medium text-text-primary">{item.name}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{item.category?.name || "-"}</td>
              <td className="px-4 py-3 text-sm text-text-primary">¥{item.price}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.stock}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.salesCount}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.status === "active" ? "bg-green-100 text-green-700" : item.status === "draft" ? "bg-gray-100 text-gray-500" : "bg-yellow-100 text-yellow-700"}`}>{item.status === "active" ? t("active") : item.status === "draft" ? t("draft") : t("inactive")}</span></td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => navigate(`/admin/products/${item.id}`)} className="mr-2 text-blue-500 hover:text-blue-700">{t("edit", { ns: "common" })}</button>
                {item.status !== "active" ? (
                  <button onClick={() => toggleMutation.mutate({ id: item.id, action: "publish" })} className="mr-2 text-green-500 hover:text-green-700">{t("publish")}</button>
                ) : (
                  <button onClick={() => toggleMutation.mutate({ id: item.id, action: "unpublish" })} className="mr-2 text-yellow-500 hover:text-yellow-700">{t("unpublish")}</button>
                )}
                <button onClick={() => duplicateMutation.mutate(item.id)} className="text-gray-500 hover:text-text-secondary">{t("duplicate", { ns: "common" })}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />
    </div>
  );
}
