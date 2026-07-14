import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Modal } from "../../components/Modal.js";
import { Select } from "../../theme/components/form/Select.js";
import { Textarea } from "../../theme/components/form/Textarea.js";
import toast from "react-hot-toast";

export default function CardsPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [revealId, setRevealId] = useState<number | null>(null);
  const [revealedContent, setRevealedContent] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cards", page, pageSize, productId, status],
    queryFn: () => apiClient.get("/admin/cards", { params: { page, pageSize, productId, status } }).then((r) => r.data.data),
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: () => apiClient.get("/admin/products", { params: { pageSize: 200 } }).then((r) => r.data.data),
  });

  const importMutation = useMutation({
    mutationFn: () => apiClient.post("/admin/cards/import", { productId: parseInt(productId), contents: importText.split("\n").filter(Boolean) }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin-cards"] }); setShowImport(false); setImportText(""); toast.success(`导入成功 ${r.data.data?.count} 条`); },
  });

  const revealMutation = useMutation({
    mutationFn: (id: number) => apiClient.get(`/admin/cards/${id}/reveal`).then((r) => r.data.data),
    onSuccess: (data) => { setRevealedContent(data?.content || ""); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "enable" | "disable" }) => apiClient.post(`/admin/cards/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cards"] }),
  });

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("cardManagement")}</h1>
        <button onClick={() => setShowImport(true)} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">{t("batchImport")}</button>
      </div>

      <div className="mb-4 flex gap-2">
        <Select value={productId} onChange={(e) => { setProductId(e.target.value); setPage(1); }} placeholderOption={t("common:all")} options={products?.items?.map((p: any) => ({ value: String(p.id), label: p.name })) || []} />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={[
          { value: "", label: t("common:all") },
          { value: "available", label: t("available") },
          { value: "locked", label: t("locked") },
          { value: "sold", label: t("sold") },
          { value: "disabled", label: t("common:disabled") },
        ]} />
      </div>

      <table className="w-full rounded-lg bg-surface shadow">
        <thead className="border-b border-border bg-surface-alt"><tr>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("id", { ns: "common" })}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("belongingProduct")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("cardContent")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("batchNo")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("cardStatus")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("operation", { ns: "common" })}</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
              <td className="px-4 py-3 text-sm text-text-primary">{item.id}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.product?.name || "-"}</td>
              <td className="px-4 py-3 text-sm font-mono text-text-secondary">{item.content}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.batchNo || "-"}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.status === "available" ? "bg-green-100 text-green-700" : item.status === "sold" ? "bg-gray-100 text-gray-500" : item.status === "locked" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{item.status === "available" ? t("available") : item.status === "sold" ? t("sold") : item.status === "locked" ? t("locked") : t("common:disabled")}</span></td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => { setRevealId(item.id); revealMutation.mutate(item.id); }} className="mr-2 text-blue-500 hover:text-blue-700">{t("reveal")}</button>
                {item.status === "disabled" ? (
                  <button onClick={() => toggleMutation.mutate({ id: item.id, action: "enable" })} className="text-green-500 hover:text-green-700">{t("common:enabled")}</button>
                ) : item.status === "available" ? (
                  <button onClick={() => toggleMutation.mutate({ id: item.id, action: "disable" })} className="text-red-500 hover:text-red-700">{t("common:disabled")}</button>
                ) : null}
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

      <Modal open={showImport} title={t("importCards")} onClose={() => setShowImport(false)}>
        <div className="space-y-4">
          <Select value={productId} onChange={(e) => setProductId(e.target.value)} placeholderOption={t("common:all")} options={products?.items?.map((p: any) => ({ value: String(p.id), label: p.name })) || []} />
          <Textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={10} className="font-mono" placeholder={t("importHint")} />
          <button onClick={() => importMutation.mutate()} disabled={!productId || !importText || importMutation.isPending} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50">{importMutation.isPending ? `${t("common:loading")}...` : t("importCards")}</button>
        </div>
      </Modal>

      <Modal open={!!revealId} title={t("cardContent")} onClose={() => { setRevealId(null); setRevealedContent(""); }}>
        <pre className="rounded bg-surface-alt p-4 text-sm text-text-primary">{revealedContent || `${t("common:loading")}...`}</pre>
      </Modal>
    </div>
  );
}
