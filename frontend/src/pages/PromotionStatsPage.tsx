import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../lib/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import { useState } from "react";

export default function PromotionStatsPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation("store");
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["promotion-stats", code],
    queryFn: () => apiClient.get(`/public/promotion/${code}/stats`).then((r) => r.data.data),
    enabled: !!code,
  });

  const { data: orders } = useQuery({
    queryKey: ["promotion-orders", code],
    queryFn: () => apiClient.get(`/public/promotion/${code}/orders`).then((r) => r.data.data),
    enabled: !!code,
  });

  if (statsLoading) return <LoadingState />;
  if (!stats) return <div className="py-12 text-center text-text-secondary">{t("promotionNotFound")}</div>;

  const siteUrl = window.location.origin;
  const promoLink = `${siteUrl}/?ref=${stats.referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(promoLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">{t("promotionCenter")}</h1>
      </div>

      {/* ─── 推广链接 ─── */}
      <div className="mb-6 rounded-lg bg-surface p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-text-primary">{t("yourPromotionLink")}</label>
        <div className="flex gap-2">
          <input readOnly value={promoLink} className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none font-mono" />
          <button onClick={handleCopy} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors shrink-0">
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
      </div>

      {/* ─── KPI 卡片 ─── */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-surface p-4 shadow">
          <p className="text-xs text-text-secondary">{t("promotionClicks")}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stats.clickCount}</p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow">
          <p className="text-xs text-text-secondary">{t("promotionOrders")}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stats.orderCount}</p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow">
          <p className="text-xs text-text-secondary">{t("promotionSales")}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">¥{Number(stats.totalSales).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow">
          <p className="text-xs text-text-secondary">{t("promotionCommission")}</p>
          <p className="mt-1 text-2xl font-bold text-green-600">¥{Number(stats.totalCommission).toFixed(2)}</p>
        </div>
      </div>

      {/* ─── 佣金比例信息 ─── */}
      <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        {t("commissionRateInfo", { rate: (Number(stats.commissionRate) * 100).toFixed(1) })}
      </div>

      {/* ─── 推广订单列表 ─── */}
      <div className="rounded-lg bg-surface shadow">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text-primary">{t("recentPromotionOrders")}</h2>
        {(!orders || orders.length === 0) ? (
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
                  <td className="px-4 py-2.5 text-right text-text-primary">¥{Number(order.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-text-primary">
                    {order.commissionAmount ? `¥${Number(order.commissionAmount).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary text-xs">{order.createdAt?.substring(0, 16)}</td>
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
