import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function ProductPage() {
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
      toast.error(`购买数量需在 ${product.minQuantity} ~ ${product.maxQuantity} 之间`);
      return;
    }
    try {
      const res = await apiClient.post("/public/orders", {
        productId: product.id, quantity, buyerEmail: email,
      });
      if (res.data.success) {
        navigate(`/checkout/${res.data.data.orderNo}`);
      } else {
        toast.error(res.data.error?.message || "下单失败");
      }
    } catch {
      toast.error("下单失败，请重试");
    }
  };

  if (isLoading) return <LoadingState />;
  if (!product) return <div className="py-16 text-center text-gray-500">商品不存在</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex h-48 items-center justify-center rounded-lg bg-gray-50 text-6xl">📦</div>
      <h1 className="mb-2 text-2xl font-bold">{product.name}</h1>
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-red-500">¥{product.price}</span>
        {product.originalPrice > 0 && <span className="text-gray-400 line-through">¥{product.originalPrice}</span>}
      </div>
      <p className="mb-4 text-sm text-gray-500">库存: {product.stock} | 已售: {product.salesCount || 0}</p>
      {product.category && <p className="mb-4 text-sm text-gray-500">分类: {product.category.name}</p>}

      {product.description && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm" dangerouslySetInnerHTML={{ __html: product.description }} />
      )}

      <div className="space-y-4 rounded-lg border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">购买数量</label>
          <input type="number" value={quantity} min={product.minQuantity} max={product.maxQuantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="w-24 rounded border px-3 py-2 text-center" />
          <span className="ml-2 text-xs text-gray-400">({product.minQuantity}~{product.maxQuantity})</span>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">邮箱（用于订单查询）</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="请输入邮箱" />
        </div>
        {product.purchaseNotes && (
          <div className="rounded bg-yellow-50 p-3 text-xs text-yellow-700">{product.purchaseNotes}</div>
        )}
        <button onClick={handleBuy} disabled={product.stock <= 0} className="w-full rounded bg-blue-500 py-3 text-lg font-medium text-white hover:bg-blue-600 disabled:opacity-50">
          {product.stock > 0 ? `立即购买 ¥${(Number(product.price) * quantity).toFixed(2)}` : "已售罄"}
        </button>
      </div>
    </div>
  );
}
