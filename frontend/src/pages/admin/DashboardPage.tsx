import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ShoppingCartIcon,
  CurrencyYenIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "../../lib/client.js";
import { SalesTrendChart } from "../../components/SalesTrendChart.js";
import dayjs from "dayjs";

/* ---------- 工具函数 ---------- */

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("admin");
  const map: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-badge-warning-bg", text: "text-badge-warning-text" },
    unpaid: { bg: "bg-badge-warning-bg", text: "text-badge-warning-text" },
    delivering: { bg: "bg-badge-info-bg", text: "text-badge-info-text" },
    paid: { bg: "bg-badge-success-bg", text: "text-badge-success-text" },
    completed: { bg: "bg-badge-success-bg", text: "text-badge-success-text" },
    delivered: { bg: "bg-badge-success-bg", text: "text-badge-success-text" },
    failed: { bg: "bg-badge-danger-bg", text: "text-badge-danger-text" },
    refunded: { bg: "bg-badge-danger-bg", text: "text-badge-danger-text" },
    cancelled: { bg: "bg-badge-info-bg", text: "text-badge-info-text" },
    closed: { bg: "bg-badge-info-bg", text: "text-badge-info-text" },
  };
  const s = map[status] || { bg: "bg-badge-info-bg", text: "text-badge-info-text" };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${s.bg} ${s.text}`}>
      {t(status, { ns: "common", defaultValue: status })}
    </span>
  );
}

function TrendArrow({ value }: { value: number }) {
  if (value > 0) return <ArrowTrendingUpIcon className="inline h-3.5 w-3.5 text-green-500" />;
  if (value < 0) return <ArrowTrendingDownIcon className="inline h-3.5 w-3.5 text-red-500" />;
  return <MinusIcon className="inline h-3.5 w-3.5 text-text-tertiary" />;
}

/* ---------- KPI 卡片 ---------- */

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: number; // 较昨日增减
  accent: "cyan" | "green" | "orange" | "red";
  loading?: boolean;
}

const accentStyles: Record<string, { bg: string; icon: string }> = {
  cyan: { bg: "bg-blue-50", icon: "text-blue-500" },
  green: { bg: "bg-green-100", icon: "text-green-500" },
  orange: { bg: "bg-yellow-100", icon: "text-yellow-500" },
  red: { bg: "bg-red-100", icon: "text-red-500" },
};

function KpiCard({ icon, label, value, unit = "", trend, accent, loading }: KpiCardProps) {
  const { t } = useTranslation("admin");
  const s = accentStyles[accent];

  if (loading) {
    return (
      <div className="rounded-xl bg-surface p-5 shadow-card">
        <div className="mb-3 h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
        <div className="mb-2 h-4 w-16 animate-pulse rounded bg-gray-200" />
        <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface p-5 shadow-card transition-shadow hover:shadow-md">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
        <span className={`h-5 w-5 ${s.icon}`}>{icon}</span>
      </div>
      <p className="text-xs text-text-secondary">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text-primary">{value}{unit && <span className="ml-0.5 text-sm font-normal text-text-secondary">{unit}</span>}</span>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs ${trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-text-tertiary"}`}>
            <TrendArrow value={trend} />
            {Math.abs(trend)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- 最近订单区域 ---------- */

function RecentOrdersSection({ loading, error, data, refetch }: {
  loading: boolean;
  error: Error | null;
  data: any[];
  refetch: () => void;
}) {
  const { t } = useTranslation("admin");

  if (loading) {
    return (
      <div className="rounded-xl bg-surface p-5 shadow-card">
        <div className="mb-4 h-5 w-24 animate-pulse rounded bg-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-14 animate-pulse rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-surface p-5 shadow-card">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ExclamationTriangleIcon className="mb-2 h-8 w-8 text-red-500" />
          <p className="mb-3 text-sm text-text-secondary">{t("failed", { ns: "common" })}</p>
          <button onClick={refetch} className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600">
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-surface p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">{t("recentOrders")}</h3>
        <div className="flex items-center justify-center py-8 text-sm text-text-tertiary">
          {t("noOrdersToday")}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{t("recentOrders")}</h3>
        <Link to="/admin/orders" className="text-xs text-blue-500 hover:text-blue-600">
          {t("viewAll")} →
        </Link>
      </div>
      <div className="divide-y divide-border">
        {data.slice(0, 6).map((order: any) => (
          <Link
            key={order.id}
            to="/admin/orders"
            className="flex items-center justify-between py-2.5 transition-colors hover:bg-surface-hover -mx-1 px-1 rounded"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {order.orderNo || `#${order.id}`}
              </p>
              <p className="text-xs text-text-tertiary">
                {dayjs(order.createdAt).format("MM-DD HH:mm")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-text-primary">¥{Number(order.totalAmount).toFixed(2)}</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- 次要指标卡片 ---------- */

function MinorStatCard({ icon, label, value, loading }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-xl bg-surface p-4 shadow-card">
        <div className="mb-2 h-4 w-12 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="h-4 w-4">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}

/* ========== 主页面 ========== */

export default function DashboardPage() {
  const { t } = useTranslation("admin");
  const [days, setDays] = useState(7);

  // 总览数据（始终是今日数据）
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiClient.get("/admin/dashboard/overview").then((r) => r.data.data),
    retry: 1,
  });

  // 趋势数据（按时间范围）
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["admin-dashboard-trend", days],
    queryFn: () => apiClient.get(`/admin/dashboard/trend?days=${days}`).then((r) => r.data.data),
    retry: 1,
  });

  // 最近订单
  const { data: recentOrders, isLoading: ordersLoading, error: ordersError, refetch } = useQuery({
    queryKey: ["admin-dashboard-recent-orders"],
    queryFn: () => apiClient.get("/admin/dashboard/recent-orders").then((r) => r.data.data),
    retry: 1,
  });

  const kpiLoading = overviewLoading;
  const kpiError = overviewError;

  /* ---------- 整体错误 ---------- */
  if (kpiError && !overviewLoading) {
    return (
      <div>
        <h1 className="mb-6 text-xl font-bold text-text-primary">{t("dashboardTitle")}</h1>
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface py-20 shadow-card">
          <ExclamationTriangleIcon className="mb-3 h-10 w-10 text-red-500" />
          <p className="mb-4 text-text-secondary">数据加载异常，请稍后重试</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 顶栏：标题 + 时间范围切换 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">{t("dashboardTitle")}</h1>
        <div className="flex gap-1 rounded-lg bg-surface p-0.5 shadow-sm">
          {[
            { key: 1, label: t("today") },
            { key: 7, label: t("last7Days") },
            { key: 30, label: t("last30Days") },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDays(opt.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === opt.key
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 核心指标行 */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={<ShoppingCartIcon className="h-5 w-5" />}
          label={t("todayOrders")}
          value={overview?.todayOrders ?? 0}
          accent="cyan"
          loading={kpiLoading}
        />
        <KpiCard
          icon={<CurrencyYenIcon className="h-5 w-5" />}
          label={t("todaySales")}
          value={overview?.todaySales ?? 0}
          unit={t("unitYuan")}
          accent="green"
          loading={kpiLoading}
        />
        <KpiCard
          icon={<ClockIcon className="h-5 w-5" />}
          label={t("pendingPayment")}
          value={overview?.pendingPayment ?? 0}
          accent="orange"
          loading={kpiLoading}
        />
        <KpiCard
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          label={t("pendingDeliveries")}
          value={overview?.pendingDeliveries ?? 0}
          accent="red"
          loading={kpiLoading}
        />
      </div>

      {/* 中栏：趋势图 + 最近订单 */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SalesTrendChart data={trendData || []} loading={trendLoading} />
        <RecentOrdersSection
          loading={ordersLoading}
          error={ordersError}
          data={recentOrders || []}
          refetch={refetch}
        />
      </div>

      {/* 底部：次要指标 */}
      <div className="grid grid-cols-3 gap-4">
        <MinorStatCard
          icon={<CubeIcon className="h-4 w-4" />}
          label={t("productCount")}
          value={overview?.productCount ?? 0}
          loading={kpiLoading}
        />
        <MinorStatCard
          icon={<KeyIcon className="h-4 w-4" />}
          label={t("availableCards")}
          value={overview?.lowStock ?? 0}
          loading={kpiLoading}
        />
        <MinorStatCard
          icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
          label={t("totalOrders")}
          value={overview?.totalOrders ?? 0}
          loading={kpiLoading}
        />
      </div>
    </div>
  );
}
