import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import { apiClient } from "../lib/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import { useTranslation } from "react-i18next";

export default function OrderDetailPage() {
  const { t } = useTranslation("store");
  const { orderNo } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["order-detail", orderNo],
    queryFn: () => apiClient.get(`/public/orders/${orderNo}/status`).then((r) => r.data.data),
  });

  if (isLoading) return <LoadingState />;
  if (!data) return <div className="py-16 text-center text-text-secondary">{t("orderNotExist")}</div>;

  return (
    <div className="mx-auto w-full max-w-md py-8">
      <h1 className="mb-6 text-center text-xl font-bold">{t("orderDetail")}</h1>
      <div className="space-y-4 rounded-lg border-border bg-surface p-6">
        <div className="text-center">
          {data.paymentStatus === "paid" ? (
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
          ) : (
            <ClockIcon className="mx-auto h-12 w-12 text-yellow-500" />
          )}
          {data.paymentStatus === "paid" ? (
            <p className="mt-2 text-lg font-medium text-green-600">{t("paymentSuccess", { ns: "common" })}</p>
          ) : (
            <p className="mt-2 text-lg font-medium text-yellow-600">{t("waitingPayment", { ns: "common" })}</p>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-secondary">{t("orderNo", { ns: "common" })}</span><span className="font-mono">{data.orderNo}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">{t("paymentStatus", { ns: "common" })}</span><span>{data.paymentStatus}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">{t("deliveryStatus", { ns: "common" })}</span><span>{data.deliveryStatus}</span></div>
        </div>
      </div>
    </div>
  );
}
