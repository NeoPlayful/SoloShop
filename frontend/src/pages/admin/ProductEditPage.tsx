import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Input } from "../../theme/components/form/Input.js";
import { Select } from "../../theme/components/form/Select.js";
import { Textarea } from "../../theme/components/form/Textarea.js";
import toast from "react-hot-toast";

export default function ProductEditPage() {
  const { t } = useTranslation("admin");
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success(t("saveSuccess", { ns: "common" })); navigate("/admin/products"); },
  });

  if (!isNew && isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{isNew ? t("addProduct") : t("editProduct")}</h1>
      <div className="max-w-2xl space-y-4 rounded-lg bg-surface p-6 shadow">
        <Input label={t("productName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label={t("productSlug")} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <Select label={t("category")} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value) })} placeholderOption={t("common:all")} options={categories?.items?.map((c: any) => ({ value: String(c.id), label: c.name })) || []} />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("price")} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          <Input label={t("originalPrice")} type="number" step="0.01" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("minQuantity")} type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: parseInt(e.target.value) || 1 })} />
          <Input label={t("maxQuantity")} type="number" value={form.maxQuantity} onChange={(e) => setForm({ ...form, maxQuantity: parseInt(e.target.value) || 1 })} />
        </div>
        <Select label={t("deliveryType")} value={form.deliveryType} onChange={(e) => setForm({ ...form, deliveryType: e.target.value })} options={[
          { value: "auto_card", label: t("autoCard") },
          { value: "text", label: t("text") },
          { value: "manual", label: t("manual") },
        ]} />
        <Textarea label={t("description", { ns: "common" })} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
        <Textarea label={t("purchaseNotes2")} value={form.purchaseNotes} onChange={(e) => setForm({ ...form, purchaseNotes: e.target.value })} rows={2} />
        <div className="flex gap-3">
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50">{saveMutation.isPending ? t("saving", { ns: "common" }) : t("save", { ns: "common" })}</button>
          <button onClick={() => navigate("/admin/products")} className="rounded border border-border px-6 py-2 text-text-primary hover:bg-surface-hover">{t("cancel", { ns: "common" })}</button>
        </div>
      </div>
    </div>
  );
}
