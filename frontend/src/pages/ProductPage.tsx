import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CubeIcon } from "@heroicons/react/24/outline";
import { apiClient } from "../lib/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import { Input } from "../theme/components/form/Input.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function ProductPage() {
  const { t } = useTranslation("store");
  const { slug } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["public-product", slug],
    queryFn: () => apiClient.get(`/public/products/${slug}`).then((r) => r.data.data),
  });

  const handleBuy = async () => {
    if (!product) return;
    if (quantity < product.minQuantity || quantity > product.maxQuantity) {
      toast.error(`Purchase quantity must be between ${product.minQuantity} and ${product.maxQuantity}`);
      return;
    }
    try {
      const res = await apiClient.post("/public/orders", {
        productId: product.id, quantity, buyerEmail: email,
      });
      if (res.data.success) {
        navigate(`/checkout/${res.data.data.orderNo}`);
      } else {
        toast.error(res.data.error?.message || "Order creation failed");
      }
    } catch {
      toast.error("Order creation failed, please try again");
    }
  };

  if (isLoading) return <LoadingState />;
  if (!product) return <div className="py-16 text-center text-text-secondary">{t("productNotExist")}</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex h-48 items-center justify-center rounded-lg bg-surface-alt">
        <CubeIcon className="h-16 w-16 text-text-tertiary" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">{product.name}</h1>
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-red-500">¥{product.price}</span>
        {product.originalPrice > 0 && <span className="text-text-tertiary line-through">¥{product.originalPrice}</span>}
      </div>
      <p className="mb-4 text-sm text-text-secondary">{t("stockInfo", { stock: product.stock, sales: product.salesCount || 0 })}</p>
      {product.category && <p className="mb-4 text-sm text-text-secondary">{t("categoryLabel", { name: product.category.name })}</p>}

      {product.description && (
        <div className="mb-6 rounded-lg bg-surface-alt p-4 text-sm" dangerouslySetInnerHTML={{ __html: product.description }} />
      )}

      <div className="space-y-4 rounded-lg border-border bg-surface p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("quantity")}</label>
          <Input type="number" value={quantity} min={product.minQuantity} max={product.maxQuantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="w-24 text-center" />
          <span className="ml-2 text-xs text-text-tertiary">{t("quantityRange", { min: product.minQuantity, max: product.maxQuantity })}</span>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("email")}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} />
        </div>
        {product.purchaseNotes && (
          <div className="rounded bg-yellow-50 p-3 text-xs text-yellow-700">{product.purchaseNotes}</div>
        )}
        <button onClick={handleBuy} disabled={product.stock <= 0} className="w-full rounded bg-blue-500 py-3 text-lg font-medium text-white hover:bg-blue-600 disabled:opacity-50">
          {product.stock > 0 ? t("buyNow", { price: (Number(product.price) * quantity).toFixed(2) }) : t("outOfStock")}
        </button>
      </div>
    </div>
  );
}
