import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { apiClient } from "../lib/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utils/format.js";

function getPaymentStatusDisplay(status: string | undefined, t: (key: string, opts?: any) => string) {
  switch (status) {
    case "paid":
      return { icon: <CheckCircleIcon className="h-10 w-10 text-green-500" />, text: t("common:paid"), color: "text-green-600" };
    case "unpaid":
      return { icon: <ClockIcon className="h-10 w-10 text-yellow-500" />, text: t("common:unpaid"), color: "text-yellow-600" };
    case "failed":
      return { icon: <XCircleIcon className="h-10 w-10 text-red-500" />, text: t("common:operationFailed"), color: "text-red-600" };
    case "refunded":
      return { icon: <CreditCardIcon className="h-10 w-10 text-gray-500" />, text: t("common:refunded") || "已退款", color: "text-gray-600" };
    default:
      return { icon: <ClockIcon className="h-10 w-10 text-gray-400" />, text: status || "-", color: "text-gray-500" };
  }
}

function getDeliveryStatusText(status: string | undefined, t: (key: string, opts?: any) => string) {
  switch (status) {
    case "delivered":
      return t("delivered");
    case "delivering":
      return t("delivering");
    case "failed":
      return t("deliveryFailed");
    case "pending":
    default:
      return t("common:pending");
  }
}

export default function OrderDetailPage() {
  const { t } = useTranslation("store");
  const { orderNo } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order-detail", orderNo, email],
    queryFn: () =>
      apiClient
        .get(`/public/orders/${orderNo}/status`, { params: email ? { email } : {} })
        .then((r) => r.data.data),
    enabled: !!orderNo,
  });

  if (isLoading) return <LoadingState />;

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-md py-16 text-center">
        <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <p className="mt-3 text-sm text-text-secondary">{t("orderNotExist")}</p>
      </div>
    );
  }

  const productName =
    data.productSnapshot?.name ||
    data.productSnapshot?.productName ||
    "-";
  const quantity = data.quantity ?? "-";
  const totalAmount = data.totalAmount ? Number(data.totalAmount).toFixed(2) : "-";
  const paymentDisplay = getPaymentStatusDisplay(data.paymentStatus, t);
  const deliveryText = getDeliveryStatusText(data.deliveryStatus, t);

  return (
    <div className="mx-auto w-full max-w-md py-8">
      <h1 className="mb-6 text-center text-xl font-bold">{t("orderDetail")}</h1>

      <div className="space-y-4">
        {/* 支付状态卡片 */}
        <div className="rounded-lg bg-surface p-6 shadow">
          <div className="flex flex-col items-center">
            {paymentDisplay.icon}
            <p className={`mt-2 text-lg font-medium ${paymentDisplay.color}`}>
              {paymentDisplay.text}
            </p>
          </div>
        </div>

        {/* 订单信息卡片 */}
        <div className="rounded-lg bg-surface p-5 shadow">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">{t("orderNo", { ns: "common" })}</h2>
          <p className="mb-4 font-mono text-sm text-text-secondary break-all">{data.orderNo}</p>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("productName")}</span>
              <span className="text-text-primary text-right max-w-[60%]">{productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("quantity")}</span>
              <span className="text-text-primary">{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("amount")}</span>
              <span className="text-text-primary font-medium">¥{totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("orderTime")}</span>
              <span className="text-text-primary text-xs">{formatDate(data.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 订单状态卡片 */}
        <div className="rounded-lg bg-surface p-5 shadow">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("common:paymentStatus")}</span>
              <span className={`font-medium ${paymentDisplay.color}`}>{paymentDisplay.text}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("common:deliveryStatus")}</span>
              <span className="text-text-primary">{deliveryText}</span>
            </div>
          </div>
        </div>

        {/* 卡密内容卡片 */}
        {data.deliveries && data.deliveries.length > 0 && (
          <div className="rounded-lg bg-surface p-5 shadow">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">{t("cardContent")}</h2>
            <div className="space-y-2">
              {data.deliveries.map((delivery: any, idx: number) => (
                <div key={idx}>
                  {delivery.cardContent ? (
                    <code className="block w-full rounded-lg bg-surface-alt px-4 py-3 text-sm font-mono text-text-primary break-all select-all">
                      {delivery.cardContent}
                    </code>
                  ) : (
                    <p className="text-xs text-text-tertiary">{t("common:pending")}</p>
                  )}
                  {delivery.deliveredAt && (
                    <p className="mt-1 text-right text-[10px] text-text-tertiary">
                      {formatDate(delivery.deliveredAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
