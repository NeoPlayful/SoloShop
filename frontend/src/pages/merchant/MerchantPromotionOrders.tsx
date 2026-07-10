import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";

export default function MerchantPromotionOrders() {
  const { t } = useTranslation("store");

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
    retry: false,
  });

  const referralCode = user?.promotionInfo?.referralCode;

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["promotion-orders", referralCode],
    queryFn: () => apiClient.get(`/public/promotion/${referralCode}/orders`).then((r) => r.data.data),
    enabled: !!referralCode,
  });

  if (isLoading || ordersLoading) return <LoadingState />;
  if (!referralCode) {
    return (
      <div className="rounded-lg bg-surface p-8 text-center shadow">
        <p className="text-sm text-text-secondary">{t("noPromotionOrders")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("sidebarPromotionOrders")}</h1>

      <div className="rounded-lg bg-surface shadow">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text-primary">
          {t("recentPromotionOrders")}
        </h2>
        {!orders || orders.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">{t("noPromotionOrders")}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-alt text-xs text-text-secondary">
                <th className="px-4 py-2 text-left">{t("orderNo")}</th>
                <th className="px-4 py-2 text-left">{t("product")}</th>
                <th className="px-4 py-2 text-right">{t("amount")}</th>
                <th className="px-4 py-2 text-right">{t("commission")}</th>
                <th className="px-4 py-2 text-right">{t("time")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any, i: number) => (
                <tr key={i} className="border-b border-border text-sm hover:bg-surface-hover">
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <Link to={`/order/${order.orderNo}`} className="text-blue-500 hover:text-blue-600 hover:underline">
                      {order.orderNo}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-primary">{order.productSnapshot?.name || "-"}</td>
                  <td className="px-4 py-2.5 text-right text-text-primary">
                    ¥{Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-primary">
                    {order.commissionAmount ? `¥${Number(order.commissionAmount).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary text-xs">
                    {order.createdAt?.substring(0, 16)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-center text-xs text-text-secondary">
        {t("promotionFooterHint")}
      </div>
    </div>
  );
}
