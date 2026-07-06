import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Modal } from "../../components/Modal.js";
import toast from "react-hot-toast";

export default function CardsPage() {
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [revealId, setRevealId] = useState<number | null>(null);
  const [revealedContent, setRevealedContent] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cards", page, productId, status],
    queryFn: () => apiClient.get("/admin/cards", { params: { page, pageSize: 20, productId, status } }).then((r) => r.data.data),
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
        <h1 className="text-xl font-bold">卡密库存</h1>
        <button onClick={() => setShowImport(true)} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">批量导入</button>
      </div>

      <div className="mb-4 flex gap-2">
        <select value={productId} onChange={(e) => { setProductId(e.target.value); setPage(1); }} className="rounded border px-3 py-2 text-sm">
          <option value="">全部商品</option>
          {products?.items?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded border px-3 py-2 text-sm">
          <option value="">全部状态</option>
          <option value="available">可售</option>
          <option value="locked">已锁定</option>
          <option value="sold">已售出</option>
          <option value="disabled">已禁用</option>
        </select>
      </div>

      <table className="w-full rounded-lg bg-white shadow">
        <thead className="border-b bg-gray-50"><tr>
          <th className="px-4 py-3 text-left text-sm">ID</th>
          <th className="px-4 py-3 text-left text-sm">商品</th>
          <th className="px-4 py-3 text-left text-sm">内容</th>
          <th className="px-4 py-3 text-left text-sm">批次</th>
          <th className="px-4 py-3 text-left text-sm">状态</th>
          <th className="px-4 py-3 text-left text-sm">操作</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{item.id}</td>
              <td className="px-4 py-3 text-sm">{item.product?.name || "-"}</td>
              <td className="px-4 py-3 text-sm font-mono text-gray-500">{item.content}</td>
              <td className="px-4 py-3 text-sm">{item.batchNo || "-"}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.status === "available" ? "bg-green-100 text-green-700" : item.status === "sold" ? "bg-gray-100 text-gray-500" : item.status === "locked" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{item.status}</span></td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => { setRevealId(item.id); revealMutation.mutate(item.id); }} className="mr-2 text-blue-500 hover:text-blue-700">查看</button>
                {item.status === "disabled" ? (
                  <button onClick={() => toggleMutation.mutate({ id: item.id, action: "enable" })} className="text-green-500 hover:text-green-700">启用</button>
                ) : item.status === "available" ? (
                  <button onClick={() => toggleMutation.mutate({ id: item.id, action: "disable" })} className="text-red-500 hover:text-red-700">禁用</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />

      <Modal open={showImport} title="批量导入卡密" onClose={() => setShowImport(false)}>
        <div className="space-y-4">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
            <option value="">选择商品</option>
            {products?.items?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={10} className="w-full rounded border px-3 py-2 text-sm font-mono" placeholder="每行一条卡密&#10;例如：&#10;ABC123-DEF456&#10;GHI789-JKL012" />
          <button onClick={() => importMutation.mutate()} disabled={!productId || !importText || importMutation.isPending} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50">{importMutation.isPending ? "导入中..." : "确认导入"}</button>
        </div>
      </Modal>

      <Modal open={!!revealId} title="卡密内容" onClose={() => { setRevealId(null); setRevealedContent(""); }}>
        <pre className="rounded bg-gray-50 p-4 text-sm">{revealedContent || "加载中..."}</pre>
      </Modal>
    </div>
  );
}
