import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function ProductEditPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", slug: "", categoryId: 0, price: 0, originalPrice: 0, description: "", deliveryType: "auto_card", minQuantity: 1, maxQuantity: 1, purchaseNotes: "" });

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => apiClient.get(`/admin/products/${id}`).then((r) => r.data.data),
    enabled: !isNew,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-all"],
    queryFn: () => apiClient.get("/admin/categories", { params: { pageSize: 100 } }).then((r) => r.data.data),
  });

  useEffect(() => {
    if (product) setForm({ name: product.name, slug: product.slug, categoryId: product.categoryId, price: Number(product.price), originalPrice: Number(product.originalPrice || 0), description: product.description || "", deliveryType: product.deliveryType, minQuantity: product.minQuantity, maxQuantity: product.maxQuantity, purchaseNotes: product.purchaseNotes || "" });
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: () => isNew ? apiClient.post("/admin/products", form) : apiClient.patch(`/admin/products/${id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("保存成功"); navigate("/admin/products"); },
  });

  if (!isNew && isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{isNew ? "新增商品" : "编辑商品"}</h1>
      <div className="max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow">
        <div><label className="mb-1 block text-sm font-medium">商品名称</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border px-3 py-2" /></div>
        <div><label className="mb-1 block text-sm font-medium">Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded border px-3 py-2" /></div>
        <div><label className="mb-1 block text-sm font-medium">分类</label><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value) })} className="w-full rounded border px-3 py-2">
          <option value={0}>请选择</option>
          {categories?.items?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium">售价（元）</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full rounded border px-3 py-2" /></div>
          <div><label className="mb-1 block text-sm font-medium">原价（元）</label><input type="number" step="0.01" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) || 0 })} className="w-full rounded border px-3 py-2" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium">最小购买数量</label><input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: parseInt(e.target.value) || 1 })} className="w-full rounded border px-3 py-2" /></div>
          <div><label className="mb-1 block text-sm font-medium">最大购买数量</label><input type="number" value={form.maxQuantity} onChange={(e) => setForm({ ...form, maxQuantity: parseInt(e.target.value) || 1 })} className="w-full rounded border px-3 py-2" /></div>
        </div>
        <div><label className="mb-1 block text-sm font-medium">发货方式</label><select value={form.deliveryType} onChange={(e) => setForm({ ...form, deliveryType: e.target.value })} className="w-full rounded border px-3 py-2">
          <option value="auto_card">自动发卡</option>
          <option value="text">固定文本</option>
          <option value="manual">人工发货</option>
        </select></div>
        <div><label className="mb-1 block text-sm font-medium">商品详情</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full rounded border px-3 py-2" /></div>
        <div><label className="mb-1 block text-sm font-medium">购买须知</label><textarea value={form.purchaseNotes} onChange={(e) => setForm({ ...form, purchaseNotes: e.target.value })} rows={2} className="w-full rounded border px-3 py-2" /></div>
        <div className="flex gap-3">
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50">{saveMutation.isPending ? "保存中..." : "保存"}</button>
          <button onClick={() => navigate("/admin/products")} className="rounded border px-6 py-2 hover:bg-gray-50">取消</button>
        </div>
      </div>
    </div>
  );
}
