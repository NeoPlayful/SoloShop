import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { NumberedPagination } from "../../theme/components/navigation/NumberedPagination.js";

export default function PromotionOrdersPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [commissionStatus, setCommissionStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotion-orders-log", search, commissionStatus, page],
    queryFn: () =>
      apiClient
        .get("/admin/promotion/orders", {
          params: { search, commissionStatus, page, pageSize: 15 },
        })
        .then((r) => r.data.data),
  });

  const list = data?.list || [];
  const total = data?.total || 0;

  const commissionStatusLabels: Record<string, string> = {
    pending: tc("pending"),
    settled: t("settled"),
    cancelled: tc("cancelled"),
  };

  const commissionStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    settled: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("orderLogTab")}</h1>

      {/* 搜索/筛选 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={`${tc("search")}...`}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 pl-9 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
          />
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={commissionStatus}
          onChange={(e) => { setCommissionStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">{t("allCommissionStatus") || tc("all")}</option>
          <option value="pending">{tc("pending")}</option>
          <option value="settled">{t("settled")}</option>
          <option value="cancelled">{tc("cancelled")}</option>
        </select>
      </div>

      {/* 表格 */}
      <div className="rounded-lg bg-surface shadow">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">{tc("loading")}</div>
        ) : list.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">{tc("noData")}</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="border-b border-border bg-surface-alt">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("orderNo")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("promoter2")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("product2") || tc("name")}</th>
                  <th className="px-4 py-3 text-right text-sm text-text-primary">{tc("amount")}</th>
                  <th className="px-4 py-3 text-right text-sm text-text-primary">{t("promotionCommission")}</th>
                  <th className="px-4 py-3 text-center text-sm text-text-primary">{t("commissionStatus")}</th>
                  <th className="px-4 py-3 text-center text-sm text-text-primary">{tc("status")}</th>
                  <th className="px-4 py-3 text-right text-sm text-text-primary">{tc("time")}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((order: any) => (
                  <tr key={order.orderNo} className="border-b border-border text-sm hover:bg-surface-hover">
                    <td className="px-4 py-3 font-mono text-xs text-text-primary">{order.orderNo}</td>
                    <td className="px-4 py-3 text-text-primary">{order.promoterEmail || order.referralCode || "-"}</td>
                    <td className="px-4 py-3 text-text-primary">{order.productSnapshot?.name || "-"}</td>
                    <td className="px-4 py-3 text-right text-text-primary">¥{Number(order.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-text-primary">
                      {order.commissionAmount != null ? `¥${Number(order.commissionAmount).toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.commissionStatus ? (
                        <span className={`inline-block rounded px-2 py-0.5 text-xs ${commissionStatusColors[order.commissionStatus] || "bg-gray-100 text-gray-700"}`}>
                          {commissionStatusLabels[order.commissionStatus] || order.commissionStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-text-tertiary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs ${
                        order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {order.paymentStatus === "paid" ? tc("paid") : tc("unpaid")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-secondary">
                      {order.createdAt?.substring(0, 16)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4">
              <NumberedPagination
                page={page}
                pageSize={15}
                total={total}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
