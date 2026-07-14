import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { NumberedPagination } from "../../theme/components/navigation/NumberedPagination.js";
import { formatDate } from "../../utils/format.js";
import {
  ShoppingCartIcon,
  CreditCardIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

/* ========== OrderLog 类型 ========== */

interface OrderLogEntry {
  id: number;
  orderId: number;
  eventType: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  operator: string | null;
  createdAt: string;
}

/* ========== 时间线颜色/图标映射 ========== */

type TimelineColorKey = "created" | "payment" | "delivery" | "completed" | "closed" | "commission" | "log";

const timelineColors: Record<TimelineColorKey, { dot: string; bg: string; icon: React.ReactNode }> = {
  created: { dot: "border-blue-500", bg: "bg-blue-50", icon: <ShoppingCartIcon className="h-4 w-4 text-blue-500" /> },
  payment: { dot: "border-green-500", bg: "bg-green-50", icon: <CreditCardIcon className="h-4 w-4 text-green-500" /> },
  delivery: { dot: "border-purple-500", bg: "bg-purple-50", icon: <TruckIcon className="h-4 w-4 text-purple-500" /> },
  completed: { dot: "border-emerald-500", bg: "bg-emerald-50", icon: <CheckCircleIcon className="h-4 w-4 text-emerald-500" /> },
  closed: { dot: "border-red-500", bg: "bg-red-50", icon: <XCircleIcon className="h-4 w-4 text-red-500" /> },
  commission: { dot: "border-amber-500", bg: "bg-amber-50", icon: <CurrencyDollarIcon className="h-4 w-4 text-amber-500" /> },
  log: { dot: "border-gray-400", bg: "bg-gray-50", icon: <ClipboardDocumentListIcon className="h-4 w-4 text-gray-500" /> },
};

function getColorKey(eventType: string): TimelineColorKey {
  if (eventType === "order.created") return "created";
  if (eventType === "order.completed") return "completed";
  if (eventType.startsWith("order.")) return "closed";
  if (eventType.startsWith("payment.")) return "payment";
  if (eventType.startsWith("card.") || eventType.startsWith("delivery.")) return "delivery";
  if (eventType.startsWith("commission.")) return "commission";
  return "log";
}

/* ========== 时间线组件 ========== */

function OrderTimeline({
  orderId,
  onClose,
}: {
  orderId: number;
  onClose: () => void;
}) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ["admin-order-logs", orderId],
    queryFn: () =>
      apiClient.get(`/admin/orders/${orderId}/order-logs`).then((r) => r.data.data),
  });

  const entries: OrderLogEntry[] = logs || [];

  const renderTimeline = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-text-secondary">{tc("loading")}</span>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="py-8 text-center text-sm text-red-500">
          {tc("operationFailed")}
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-text-secondary">
          {tc("noData")}
        </div>
      );
    }

    return (
      <div className="relative pl-8">
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

        <div className="space-y-5">
          {entries.map((entry) => {
            const colorKey = getColorKey(entry.eventType);
            const colors = timelineColors[colorKey];
            const m = entry.metadata || {};

            // 判断是否含可查看的卡密/发货内容
            const hasRevealContent =
              (entry.eventType === "card.delivered" && !!m.content) ||
              (entry.eventType === "delivery.manual" && !!m.content);
            const isRevealed = revealedIds.has(entry.id);

            return (
              <div key={entry.id} className="relative">
                <div className={`absolute -left-[23px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-surface ${colors.dot}`}>
                  {colors.icon}
                </div>

                <div className={`rounded-lg border border-border p-3 ${colorKey === "log" ? "" : colors.bg}`}>
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 pt-0.5 text-xs text-text-tertiary">
                      {formatDate(entry.createdAt)}
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      {entry.message || entry.eventType}
                    </span>
                  </div>

                  {/* 管理员/系统标识 */}
                  {entry.operator && (
                    <p className="mt-0.5 text-[11px] text-text-tertiary">
                      {entry.operator === "system" ? tc("system") : `${tc("operator")}: ${entry.operator}`}
                    </p>
                  )}

                  {/* 卡密/发货内容 - 点击查看 */}
                  {hasRevealContent && (
                    <div className="mt-2">
                      {isRevealed ? (
                        <code className="block rounded bg-surface-alt px-2 py-1 text-xs font-mono text-text-primary break-all">
                          {m.content as string}
                        </code>
                      ) : (
                        <button
                          onClick={() => setRevealedIds((prev) => new Set(prev).add(entry.id))}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-500 hover:bg-surface-hover transition-colors border border-blue-200"
                        >
                          <EyeIcon className="h-3 w-3" />
                          {t("revealContent")}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-text-tertiary">
                  {entry.eventType}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-surface-alt p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <ClipboardDocumentListIcon className="h-4 w-4" />
          {t("timelineTitle")}
          {!isLoading && (
            <span className="text-xs font-normal text-text-tertiary">
              ({entries.length} {t("events")})
            </span>
          )}
        </h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-secondary hover:bg-surface-hover transition-colors"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>
      {renderTimeline()}
    </div>
  );
}

/* ========== 主页面 ========== */

export default function PromotionOrdersPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [commissionStatus, setCommissionStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotion-orders-log", search, commissionStatus, page, pageSize],
    queryFn: () =>
      apiClient
        .get("/admin/promotion/orders", {
          params: { search, commissionStatus, page, pageSize },
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

  const handleRowClick = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("orderLogTab")}</h1>

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
                  <th className="w-8 px-4 py-3" />
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
                {list.map((order: any) => {
                  const isExpanded = expandedId === order.id;
                  return (
                    <Fragment key={order.id}>
                      <tr
                        onClick={() => handleRowClick(order.id)}
                        className={`cursor-pointer border-b border-border text-sm transition-colors hover:bg-surface-hover ${isExpanded ? "bg-surface-alt" : ""}`}
                      >
                        <td className="w-8 px-4 py-3">
                          <svg
                            className={`h-3 w-3 text-text-tertiary transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
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
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="border-b border-border bg-surface-alt px-4 pb-4">
                            <OrderTimeline
                              orderId={order.id}
                              onClose={() => setExpandedId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>

            <div className="px-4">
              <NumberedPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
                pageSizeOptions={[10, 20, 50, 100]}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
