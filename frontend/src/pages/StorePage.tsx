import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client.js";
import { LoadingState } from "../components/LoadingStates.js";

export default function StorePage() {
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
        <button onClick={() => setCategoryId("")} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${!categoryId ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>全部</button>
        {categories?.map((cat: any) => (
          <button key={cat.id} onClick={() => setCategoryId(String(cat.id))} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${categoryId === String(cat.id) ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{cat.name}</button>
        ))}
      </div>

      {/* 商品网格 */}
      {isLoading ? <LoadingState /> : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products?.map((product: any) => (
            <Link key={product.id} to={`/product/${product.slug}`} className="group rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 flex h-32 items-center justify-center rounded bg-gray-50 text-4xl">📦</div>
              <h3 className="mb-1 text-sm font-medium group-hover:text-blue-500">{product.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-red-500">¥{product.price}</span>
                {product.originalPrice > 0 && <span className="text-xs text-gray-400 line-through">¥{product.originalPrice}</span>}
              </div>
              <p className="mt-1 text-xs text-gray-400">已售 {product.salesCount || 0}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
