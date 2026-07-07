import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function CheckoutPage() {
  const { t } = useTranslation("store");
  const { orderNo } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState("mock");

  const { data: channels } = useQuery({
    queryKey: ["payment-channels"],
    queryFn: () => apiClient.get("/public/payment/channels").then((r) => r.data.data),
  });

  const { data: order } = useQuery({
    queryKey: ["order-status", orderNo],
    queryFn: () => apiClient.get(`/public/orders/${orderNo}/status`).then((r) => r.data.data),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (order?.paymentStatus === "paid") {
      navigate(`/order/${orderNo}`);
    }
  }, [order, orderNo, navigate]);

  // 监听订单支付状态
  useEffect(() => {
    if (!orderNo) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/public/payment/status/${orderNo}`);
        if (res.data.data?.paymentStatus === "paid") {
          clearInterval(interval);
          navigate(`/order/${orderNo}`);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [orderNo, navigate]);

  const handlePay = async () => {
    try {
      const res = await apiClient.post("/public/payment/create", { orderNo, channel });
      if (res.data.success) {
        // Mock 支付直接回调
        await apiClient.post("/webhook/pay/mock", { orderNo });
        toast.success("Payment successful!");
        navigate(`/order/${orderNo}`);
      }
    } catch {
      toast.error("Payment creation failed");
    }
  };

  if (!orderNo) return null;

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-6 text-center text-xl font-bold">{t("confirmOrder")}</h1>
      <div className="mb-6 rounded-lg border-border bg-surface p-6">
        <p className="mb-2 text-sm text-text-secondary">{t("orderNo", { ns: "common" })}</p>
        <p className="mb-4 font-mono text-lg">{orderNo}</p>
        <p className="mb-2 text-sm text-text-secondary">{t("paymentMethod")}</p>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full rounded border-border px-3 py-2">
          {channels?.map((ch: any) => <option key={ch.code} value={ch.code}>{ch.name}</option>)}
        </select>
      </div>

      <button onClick={handlePay} className="w-full rounded bg-green-500 py-3 text-lg font-medium text-white hover:bg-green-600">
        {t("payNow", { ns: "common" })}
      </button>
      <p className="mt-4 text-center text-xs text-text-tertiary">{t("autoRedirect")}</p>
    </div>
  );
}
