import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client.js";
import { LoadingState } from "../components/LoadingStates.js";

export default function OrderDetailPage() {
  const { orderNo } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["order-detail", orderNo],
    queryFn: () => apiClient.get(`/public/orders/${orderNo}/status`).then((r) => r.data.data),
  });

  if (isLoading) return <LoadingState />;
  if (!data) return <div className="py-16 text-center text-gray-500">订单不存在</div>;

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-6 text-center text-xl font-bold">订单详情</h1>
      <div className="space-y-4 rounded-lg border bg-white p-6">
        <div className="text-center">
          <span className="text-5xl">{data.paymentStatus === "paid" ? "✅" : "⏳"}</span>
          {data.paymentStatus === "paid" ? (
            <p className="mt-2 text-lg font-medium text-green-600">支付成功</p>
          ) : (
            <p className="mt-2 text-lg font-medium text-yellow-600">等待支付</p>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">订单号</span><span className="font-mono">{data.orderNo}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">支付状态</span><span>{data.paymentStatus}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">发货状态</span><span>{data.deliveryStatus}</span></div>
        </div>
      </div>
    </div>
  );
}
