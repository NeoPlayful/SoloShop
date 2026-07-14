import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import { Select } from "../theme/components/form/Select.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function CheckoutPage() {
  const { t } = useTranslation("store");
  const { orderNo } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState("mock");
  const [paying, setPaying] = useState(false);
  const [payInfo, setPayInfo] = useState<{ payUrl: string; qrcode?: string } | null>(null);

  const { data: channels } = useQuery({
    queryKey: ["payment-channels"],
    queryFn: () => apiClient.get("/public/payment/channels").then((r) => r.data.data),
  });

  const { data: order } = useQuery({
    queryKey: ["order-status", orderNo],
    queryFn: () => apiClient.get(`/public/orders/${orderNo}/status`).then((r) => r.data.data),
    refetchInterval: 3000,
  });

  const buyerEmail = order?.buyerEmail;
  const orderDetailUrl = `/order/${orderNo}${buyerEmail ? `?email=${encodeURIComponent(buyerEmail)}` : ""}`;

  // 检测支付成功 → 跳转
  useEffect(() => {
    if (order?.paymentStatus === "paid") {
      navigate(orderDetailUrl);
    }
  }, [order, orderNo, navigate, orderDetailUrl]);

  // 轮询支付状态（用于真实支付渠道）
  useEffect(() => {
    if (!orderNo || payInfo === null) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/public/payment/status/${orderNo}`);
        if (res.data.data?.paymentStatus === "paid") {
          clearInterval(interval);
          toast.success(t("common:success"));
          navigate(orderDetailUrl);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [orderNo, navigate, orderDetailUrl, payInfo]);

  const handlePay = async () => {
    if (!channel) {
      toast.error(t("selectPayment"));
      return;
    }

    setPaying(true);
    try {
      const res = await apiClient.post("/public/payment/create", { orderNo, channel });

      if (!res.data.success) {
        toast.error(res.data.error?.message || t("paymentCreateFail"));
        setPaying(false);
        return;
      }

      const { payUrl, isEpay } = res.data.data;

      if (isEpay) {
        // 真实支付：显示支付链接或二维码
        setPayInfo({ payUrl, qrcode: res.data.data.qrcode });
        setPaying(false);

        // 在新窗口打开支付页面
        window.open(payUrl, "_blank");
      } else {
        // Mock 支付：直接回调
        await apiClient.post("/webhook/pay/mock", { orderNo });
        toast.success(t("common:success"));
        navigate(orderDetailUrl);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || t("paymentCreateFail");
      toast.error(msg);
      setPaying(false);
    }
  };

  if (!orderNo) return null;

  return (
    <div className="mx-auto w-full max-w-md py-8">
      <h1 className="mb-6 text-center text-xl font-bold">{t("confirmOrder")}</h1>

      {/* 支付信息 */}
      <div className="mb-6 rounded-lg border-border bg-surface p-6">
        <p className="mb-2 text-sm text-text-secondary">{t("orderNo", { ns: "common" })}</p>
        <p className="mb-4 font-mono text-lg">{orderNo}</p>

        {payInfo ? (
          /* ─── 真实支付等待页 ─── */
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-blue-500" />
              <p className="text-sm text-text-primary">{t("common:processing")}</p>
              <p className="mt-1 text-xs text-text-tertiary">{t("autoRedirect")}</p>
            </div>
            <a
              href={payInfo.payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors"
            >
              {t("common:payNow")}
            </a>
            <p className="mt-2 text-xs text-text-tertiary">
              支付完成后页面将自动跳转
            </p>
          </div>
        ) : (
          /* ─── 支付选择页 ─── */
          <>
            <p className="mb-2 text-sm text-text-secondary">{t("paymentMethod")}</p>
            <Select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              options={channels?.map((ch: any) => ({ value: ch.code, label: ch.name })) || []}
            />
          </>
        )}
      </div>

      {!payInfo && (
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full rounded bg-green-500 py-3 text-lg font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {paying ? t("common:processing") : t("common:payNow")}
        </button>
      )}
    </div>
  );
}
