import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
    if (quantity > product.stock) {
      toast.error("Insufficient stock");
      return;
    }
    try {
      const promoRef = localStorage.getItem("soloshop_promo_ref") || undefined;
      const res = await apiClient.post("/public/orders", {
        productId: product.id, quantity, buyerEmail: email,
        referralCode: promoRef,
      });
      if (res.data.success) {
        navigate(`/checkout/${res.data.data.orderNo}`);
      } else {
        toast.error(res.data.error?.message || "Order creation failed");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Order creation failed, please try again");
    }
  };

  if (isLoading) return <LoadingState />;
  if (!product) return <div className="py-16 text-center text-text-secondary">{t("productNotExist")}</div>;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* 左右分栏：主图(左) + 信息/购买区(右) */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* 左：商品主图 */}
        <div className="w-full md:w-1/2">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface-alt">
            {product.coverImage ? (
              <img src={product.coverImage} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <img src="/images/default-product.png" alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </div>

        {/* 右：商品信息 + 购买区 */}
        <div className="flex w-full flex-col gap-3 md:w-1/2">
          <h1 className="text-xl font-bold">{product.name}</h1>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-red-500">¥{product.price}</span>
            {product.originalPrice > 0 && <span className="text-text-tertiary line-through">¥{product.originalPrice}</span>}
          </div>
          <p className="text-sm text-text-secondary">{t("stockInfo", { stock: product.stock, sales: product.salesCount || 0 })}</p>
          {product.category && <p className="text-sm text-text-secondary">{t("categoryLabel", { name: product.category.name })}</p>}

          {/* 购买卡片 */}
          <div className="md:sticky md:top-8 mt-2 space-y-2.5 rounded-lg border border-border bg-surface p-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("quantity")}</label>
              <Input type="number" value={quantity} min={product.minQuantity} max={Math.min(product.maxQuantity, product.stock)} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="w-24 text-center" />
              <span className="ml-2 text-xs text-text-tertiary">{t("quantityRange", { min: product.minQuantity, max: product.maxQuantity })}</span>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("email")}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} />
            </div>
            {product.purchaseNotes && (
              <div className="rounded bg-yellow-50 p-3 text-xs text-yellow-700">{product.purchaseNotes}</div>
            )}
            <button onClick={handleBuy} disabled={product.stock <= 0} className="w-full rounded bg-blue-500 py-2.5 text-lg font-medium text-white hover:bg-blue-600 disabled:opacity-50">
              {product.stock > 0 ? t("buyNow", { price: (Number(product.price) * quantity).toFixed(2) }) : t("outOfStock")}
            </button>
          </div>
        </div>
      </div>

      {/* 底部：商品说明 */}
      {product.description && (
        <div className="mt-8 rounded-lg bg-surface-alt p-4 text-sm" dangerouslySetInnerHTML={{ __html: product.description }} />
      )}
    </div>
  );
}
