import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import { useTranslation } from "react-i18next";

export default function StorePage() {
  const { t } = useTranslation("store");
  const [categoryId, setCategoryId] = useState("");
  const { data: categories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => apiClient.get("/public/categories").then((r) => r.data.data),
  });
  const { data: products, isLoading } = useQuery({
    queryKey: ["public-products", categoryId],
    queryFn: () => apiClient.get("/public/products", { params: { categoryId } }).then((r) => r.data.data),
  });

  return (
    <div>
      {/* 分类 Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        <button onClick={() => setCategoryId("")} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${!categoryId ? "bg-blue-500 text-white" : "bg-surface-hover text-text-secondary hover:bg-surface-hover"}`}>{t("allCategories")}</button>
        {categories?.map((cat: any) => (
          <button key={cat.id} onClick={() => setCategoryId(String(cat.id))} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${categoryId === String(cat.id) ? "bg-blue-500 text-white" : "bg-surface-hover text-text-secondary hover:bg-surface-hover"}`}>{cat.name}</button>
        ))}
      </div>

      {/* 商品网格 */}
      {isLoading ? <LoadingState /> : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products?.map((product: any) => (
            <Link key={product.id} to={`/product/${product.slug}`} className="group rounded-lg border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded bg-surface-alt">
                {product.coverImage ? (
                  <img src={product.coverImage} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <img src="/images/default-product.png" alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <h3 className="mb-1 text-sm font-medium group-hover:text-blue-500">{product.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-red-500">¥{product.price}</span>
                {product.originalPrice > 0 && <span className="text-xs text-text-tertiary line-through">¥{product.originalPrice}</span>}
              </div>
              <p className="mt-1 text-xs text-text-tertiary">{t("soldCount", { count: product.salesCount || 0 })}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
